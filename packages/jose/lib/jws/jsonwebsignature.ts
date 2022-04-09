import { Nullable, Optional } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-json-web-key.exception';
import { InvalidJsonWebSignatureException } from '../exceptions/invalid-json-web-signature.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebKeyLoader } from '../types/jsonwebkey-loader';
import { JSON_WEB_SIGNATURE_ALGORITHMS_REGISTRY } from './algorithms/jsonwebsignature-algorithms-registry';
import { SupportedJsonWebSignatureAlgorithm } from './algorithms/types/supported-jsonwebsignature-algorithm';
import { JsonWebSignatureHeaderParams } from './jsonwebsignature-header.params';
import { JsonWebSignatureHeader } from './jsonwebsignature.header';
import { DecodeCompactParams } from './types/decode-compact.params';

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7515.html RFC 7515}.
 */
export class JsonWebSignature {
  /**
   * Header of the JSON Web Signature.
   */
  public readonly header: JsonWebSignatureHeader;

  /**
   * Payload of the JSON Web Signature.
   */
  public readonly payload: Buffer;

  /**
   * Instantiates a new JSON Web Signature based on the provided JSON Web Signature Header and Payload.
   *
   * @param header JSON Web Signature Header.
   * @param payload Buffer to be used as the Payload.
   */
  public constructor(header: JsonWebSignatureHeaderParams, payload?: Optional<Buffer>) {
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
  public static decodeCompact(token: string): DecodeCompactParams {
    if (typeof token !== 'string') {
      throw new InvalidJsonWebSignatureException();
    }

    const splitToken = token.split('.');

    if (splitToken.length !== 3) {
      throw new InvalidJsonWebSignatureException();
    }

    try {
      const [b64Header, b64Payload, b64Signature] = splitToken;

      const header = new JsonWebSignatureHeader(JSON.parse(Buffer.from(b64Header, 'base64url').toString('utf8')));
      const payload = Buffer.from(b64Payload, 'base64url');
      const signature = Buffer.from(b64Signature, 'base64url');

      return { header, payload, signature };
    } catch (exc: any) {
      if (exc instanceof InvalidJsonWebSignatureException) {
        throw exc;
      }

      throw exc instanceof JoseException
        ? new InvalidJsonWebSignatureException(exc)
        : new InvalidJsonWebSignatureException(null, exc);
    }
  }

  /**
   * Deserializes a JSON Web Signature Compact Token.
   *
   * @param token JSON Web Signature Compact Token to be Deserialized.
   * @param key JSON Web Key used to verify the Signature of the JSON Web Signature Compact Token.
   * @returns JSON Web Signature containing the Deserialized JSON Web Signature Header and Payload.
   */
  public static async deserializeCompact(
    token: string,
    key: Nullable<JsonWebKey>,
    expectedAlgorithms?: Optional<SupportedJsonWebSignatureAlgorithm[]>
  ): Promise<JsonWebSignature>;

  /**
   * Deserializes a JSON Web Signature Compact Token.
   *
   * @param token JSON Web Signature Compact Token to be Deserialized.
   * @param keyLoader Function used to load the JSON Web Key used to verify
   * the Signature of the JSON Web Signature Compact Token.
   * @returns JSON Web Signature containing the Deserialized JSON Web Signature Header and Payload.
   */
  public static async deserializeCompact(
    token: string,
    keyLoader: JsonWebKeyLoader,
    expectedAlgorithms?: Optional<SupportedJsonWebSignatureAlgorithm[]>
  ): Promise<JsonWebSignature>;

  /**
   * Deserializes a JSON Web Signature Compact Token.
   *
   * @param token JSON Web Signature Compact Token to be Deserialized.
   * @param keyOrKeyLoader JSON Web Key or function used to load the JSON Web Key used to verify
   * the Signature of the JSON Web Signature Compact Token.
   * @returns JSON Web Signature containing the Deserialized JSON Web Signature Header and Payload.
   */
  public static async deserializeCompact(
    token: string,
    keyOrKeyLoader: Nullable<JsonWebKey> | JsonWebKeyLoader,
    expectedAlgorithms?: Optional<SupportedJsonWebSignatureAlgorithm[]>
  ): Promise<JsonWebSignature> {
    if (keyOrKeyLoader !== null && !(keyOrKeyLoader instanceof JsonWebKey) && typeof keyOrKeyLoader !== 'function') {
      throw new InvalidJsonWebKeyException();
    }

    const { header, payload, signature } = this.decodeCompact(token);

    const key = typeof keyOrKeyLoader === 'function' ? await keyOrKeyLoader(header) : keyOrKeyLoader;

    if (Array.isArray(expectedAlgorithms) && expectedAlgorithms.every((alg) => alg !== header.alg)) {
      throw new InvalidJsonWebSignatureException(
        `The Algorithm "${header.alg}" does not match the expected Algorithms.`
      );
    }

    const b64Header = Buffer.from(header.toString(), 'utf8').toString('base64url');
    const b64Payload = payload.toString('base64url');

    const message = Buffer.from(`${b64Header}.${b64Payload}`, 'utf8');

    const algorithm = JSON_WEB_SIGNATURE_ALGORITHMS_REGISTRY[header.alg];

    await algorithm.verify(signature, message, key ?? undefined);

    return new JsonWebSignature(header, payload);
  }

  /**
   * Serializes the JSON Web Signature into a Compact Token.
   *
   * @param key JSON Web Key used to Sign the JSON Web Signature Token.
   * @returns JSON Web Signature Compact Token.
   */
  public async serializeCompact(key?: Optional<JsonWebKey>): Promise<string> {
    const { header, payload } = this;

    try {
      const b64Header = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
      const b64Payload = payload.toString('base64url');

      const message = Buffer.from(`${b64Header}.${b64Payload}`, 'utf8');

      const algorithm = JSON_WEB_SIGNATURE_ALGORITHMS_REGISTRY[header.alg];

      const signature = await algorithm.sign(message, key);

      const b64Signature = signature.toString('base64url');

      return `${message}.${b64Signature}`;
    } catch (exc: any) {
      if (exc instanceof InvalidJsonWebSignatureException) {
        throw exc;
      }

      throw exc instanceof JoseException
        ? new InvalidJsonWebSignatureException(exc)
        : new InvalidJsonWebSignatureException(null, exc);
    }
  }
}
