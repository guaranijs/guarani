import { Buffer } from 'buffer';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../exceptions/invalid-jsonwebsignature.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKeyLoader } from '../jsonwebkey-loader.type';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { ES256, ES384, ES512 } from './backends/ecdsa.backend';
import { HS256, HS384, HS512 } from './backends/hmac.backend';
import { JsonWebSignatureBackend } from './backends/jsonwebsignature.backend';
import { none } from './backends/none.backend';
import { PS256, PS384, PS512, RS256, RS384, RS512 } from './backends/rsassa.backend';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature-algorithm.enum';
import { JsonWebSignatureHeader } from './jsonwebsignature.header';
import { JsonWebSignatureHeaderParameters } from './jsonwebsignature.header.parameters';

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
   * Supported JSON Web Signature Backends.
   */
  private static readonly backends: Record<JsonWebSignatureAlgorithm, JsonWebSignatureBackend> = {
    [JsonWebSignatureAlgorithm.ES256]: ES256,
    [JsonWebSignatureAlgorithm.ES384]: ES384,
    [JsonWebSignatureAlgorithm.ES512]: ES512,
    [JsonWebSignatureAlgorithm.HS256]: HS256,
    [JsonWebSignatureAlgorithm.HS384]: HS384,
    [JsonWebSignatureAlgorithm.HS512]: HS512,
    [JsonWebSignatureAlgorithm.None]: none,
    [JsonWebSignatureAlgorithm.PS256]: PS256,
    [JsonWebSignatureAlgorithm.PS384]: PS384,
    [JsonWebSignatureAlgorithm.PS512]: PS512,
    [JsonWebSignatureAlgorithm.RS256]: RS256,
    [JsonWebSignatureAlgorithm.RS384]: RS384,
    [JsonWebSignatureAlgorithm.RS512]: RS512,
  };

  /**
   * Instantiates a new JSON Web Signature based on the provided JSON Web Signature Header and Payload.
   *
   * @param header JSON Web Signature Header.
   * @param payload Buffer to be used as the Payload.
   */
  public constructor(header: JsonWebSignatureHeaderParameters, payload?: Buffer) {
    if (payload !== undefined && !Buffer.isBuffer(payload)) {
      throw new TypeError('Invalid JSON Web Signature Payload.');
    }

    this.header = new JsonWebSignatureHeader(header);
    this.payload = Buffer.isBuffer(payload) ? payload : Buffer.alloc(0);
  }

  /**
   * Decodes the Parameters of the provided JSON Web Signature Compact Token.
   *
   * ***note: this method does not validate the signature of the token.***
   *
   * @param token JSON Web Signature Compact Token to be decoded.
   * @returns Decoded Parameters of the JSON Web Signature Compact Token.
   */
  public static decode(token: string): [JsonWebSignatureHeader, Buffer, Buffer] {
    if (typeof token !== 'string') {
      throw new InvalidJsonWebSignatureException();
    }

    const splitToken = token.split('.');

    if (splitToken.length !== 3) {
      throw new InvalidJsonWebSignatureException();
    }

    try {
      const [b64Header, b64Payload, b64Signature] = splitToken;

      const headerParameters = JSON.parse(Buffer.from(<string>b64Header, 'base64url').toString('utf8'));

      const header = new JsonWebSignatureHeader(headerParameters);
      const payload = Buffer.from(<string>b64Payload, 'base64url');
      const signature = Buffer.from(<string>b64Signature, 'base64url');

      return [header, payload, signature];
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
    keyOrKeyLoader: JsonWebKey | JsonWebKeyLoader | null,
    expectedAlgorithms?: JsonWebSignatureAlgorithm[]
  ): Promise<JsonWebSignature> {
    try {
      if (keyOrKeyLoader !== null && !(keyOrKeyLoader instanceof JsonWebKey) && typeof keyOrKeyLoader !== 'function') {
        throw new InvalidJsonWebKeyException();
      }

      const [header, payload, signature] = this.decode(token);

      const key = typeof keyOrKeyLoader === 'function' ? await keyOrKeyLoader(header) : keyOrKeyLoader;

      if (Array.isArray(expectedAlgorithms) && !expectedAlgorithms.includes(header.alg)) {
        throw new InvalidJsonWebSignatureException(
          `The JSON Web Signature Algorithm "${header.alg}" does not match the expected algorithms.`
        );
      }

      const b64Header = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
      const b64Payload = payload.toString('base64url');

      const message = Buffer.from(`${b64Header}.${b64Payload}`, 'utf8');
      const backend = this.backends[header.alg];

      await backend.verify(signature, message, key ?? undefined);

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
   * @param key JSON Web Key used to Sign the JSON Web Signature Token.
   * @returns JSON Web Signature Compact Token.
   */
  public async sign(key?: JsonWebKey): Promise<string> {
    try {
      const { header, payload } = this;

      const b64Header = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
      const b64Payload = payload.toString('base64url');

      const message = Buffer.from(`${b64Header}.${b64Payload}`, 'utf8');
      const backend = JsonWebSignature.backends[header.alg];

      const signature = await backend.sign(message, key);

      const b64Signature = signature.toString('base64url');

      return `${message}.${b64Signature}`;
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