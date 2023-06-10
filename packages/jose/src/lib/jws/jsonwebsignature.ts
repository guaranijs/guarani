import { Buffer } from 'buffer';

import { Nullable } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../exceptions/invalid-jsonwebsignature.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKeyLoader } from '../jsonwebkey-loader.type';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebSignatureHeader } from './jsonwebsignature.header';
import { JsonWebSignatureHeaderParameters } from './jsonwebsignature.header.parameters';
import { JsonWebSignatureParameters } from './jsonwebsignature.parameters';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature-algorithm.type';

type SplitJsonWebSignatureToken = [string, string, string];

/**
 * Implementation of a JSON Web Signature.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7515.html
 */
export class JsonWebSignature {
  /**
   * JSON Web Signature Header.
   */
  public readonly header: JsonWebSignatureHeader;

  /**
   * JSON Web Signature Payload.
   */
  public readonly payload: Buffer;

  /**
   * Instantiates a new JSON Web Signature based on the provided JSON Web Signature Header and Payload.
   *
   * @param header JSON Web Signature Header.
   * @param payload Buffer to be used as the Payload.
   */
  public constructor(header: JsonWebSignatureHeaderParameters, payload?: Buffer) {
    if (typeof payload !== 'undefined' && !Buffer.isBuffer(payload)) {
      throw new TypeError('Invalid JSON Web Signature Payload.');
    }

    this.header = new JsonWebSignatureHeader(header);
    this.payload = Buffer.isBuffer(payload) ? payload : Buffer.alloc(0);
  }

  /**
   * Checks if the provided data has a valid JSON Web Signature Compact Serialization format.
   *
   * @param data Data to be checked.
   */
  public static isJsonWebSignature(data: unknown): boolean {
    if (typeof data !== 'string') {
      return false;
    }

    const splitToken = data.split('.');

    return splitToken.length === 3 && splitToken.slice(0, 2).every((component) => component.length !== 0);
  }

  /**
   * Decodes the Parameters of the provided JSON Web Signature Compact Token.
   *
   * ***note: this method does not validate the signature of the token.***
   *
   * @param token JSON Web Signature Compact Token to be decoded.
   * @returns Decoded Parameters of the JSON Web Signature Compact Token.
   */
  public static decode(token: string): JsonWebSignatureParameters {
    if (!JsonWebSignature.isJsonWebSignature(token)) {
      throw new InvalidJsonWebSignatureException();
    }

    try {
      const [b64Header, b64Payload, b64Signature] = token.split('.') as SplitJsonWebSignatureToken;

      const headerParameters = JSON.parse(Buffer.from(b64Header, 'base64url').toString('utf8'));

      const header = new JsonWebSignatureHeader(headerParameters);
      const payload = Buffer.from(b64Payload, 'base64url');
      const signature = Buffer.from(b64Signature, 'base64url');

      return { header, payload, signature };
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebSignatureException();
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Deserializes a JSON Web Signature Compact Token.
   *
   * @param token JSON Web Signature Compact Token to be Deserialized.
   * @param keyOrKeyLoader JSON Web Key used to verify the Signature of the JSON Web Signature Compact Token.
   * @param expectedAlgorithms JSON Web Signature Algorithms expected to be defined by the Header.
   * @returns JSON Web Signature containing the Deserialized JSON Web Signature Header and Payload.
   */
  public static async verify(
    token: string,
    keyOrKeyLoader: Nullable<JsonWebKey | JsonWebKeyLoader>,
    expectedAlgorithms: JsonWebSignatureAlgorithm[]
  ): Promise<JsonWebSignature> {
    if (keyOrKeyLoader !== null && !(keyOrKeyLoader instanceof JsonWebKey) && typeof keyOrKeyLoader !== 'function') {
      throw new InvalidJsonWebKeyException();
    }

    const { header, payload, signature } = JsonWebSignature.decode(token);

    const { backend } = header;

    try {
      if (!expectedAlgorithms.includes(header.alg)) {
        throw new InvalidJsonWebSignatureException(
          `The JSON Web Signature Algorithm "${header.alg}" does not match the expected algorithms.`
        );
      }

      const key = typeof keyOrKeyLoader === 'function' ? await keyOrKeyLoader(header) : keyOrKeyLoader;

      const b64Header = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
      const b64Payload = payload.toString('base64url');

      const message = Buffer.from(`${b64Header}.${b64Payload}`, 'ascii');

      await backend.verify(signature, message, key);

      return new JsonWebSignature(header, payload);
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebSignatureException();
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Serializes the JSON Web Signature into a Compact Token.
   *
   * @param keyOrKeyLoader JSON Web Key used to Sign the JSON Web Signature Token.
   * @returns JSON Web Signature Compact Token.
   */
  public async sign(keyOrKeyLoader: Nullable<JsonWebKey | JsonWebKeyLoader>): Promise<string> {
    try {
      const { header, payload } = this;

      const b64Header = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
      const b64Payload = payload.toString('base64url');

      const key = typeof keyOrKeyLoader === 'function' ? await keyOrKeyLoader(header) : keyOrKeyLoader;

      const message = Buffer.from(`${b64Header}.${b64Payload}`, 'ascii');
      const signature = await header.backend.sign(message, key);

      const b64Signature = signature.toString('base64url');

      return `${b64Header}.${b64Payload}.${b64Signature}`;
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebSignatureException();
      exception.cause = exc;

      throw exception;
    }
  }
}
