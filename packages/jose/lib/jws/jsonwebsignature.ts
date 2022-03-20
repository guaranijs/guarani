import { Nullable, Optional } from '@guarani/types';

import { InvalidJsonWebKeyException } from '../exceptions/invalid-json-web-key.exception';
import { InvalidJsonWebSignatureException } from '../exceptions/invalid-json-web-signature.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JSON_WEB_SIGNATURE_ALGORITHMS_REGISTRY } from './algorithms/jsonwebsignature-algorithms-registry';
import { JsonWebSignatureHeaderParams } from './jsonwebsignature-header.params';
import { JsonWebSignatureHeader } from './jsonwebsignature.header';

/**
 * Implementation of RFC 7515.
 *
 * The **JSON Web Signature** is used for transporting data on the network,
 * providing a signature that guarantees the integrity of the information.
 *
 * This implementation provides a set of attributes to represent the state
 * of the information, as well as segregating the header from the payload,
 * which in turn facilitates the use of any of them.
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
   * @param payload String to be used as the Payload.
   */
  public constructor(header: JsonWebSignatureHeaderParams, payload: Optional<string>);

  /**
   * Instantiates a new JSON Web Signature based on the provided JSON Web Signature Header and Payload.
   *
   * @param header JSON Web Signature Header.
   * @param payload Buffer to be used as the Payload.
   */
  public constructor(header: JsonWebSignatureHeaderParams, payload: Optional<Buffer>);

  /**
   * Instantiates a new JSON Web Signature based on the provided JSON Web Signature Header and Payload.
   *
   * @param header JSON Web Signature Header.
   * @param payload Data to be used as the Payload.
   */
  public constructor(header: JsonWebSignatureHeaderParams, payload?: Optional<string | Buffer>) {
    if (payload !== undefined && typeof payload !== 'string' && !Buffer.isBuffer(payload)) {
      throw new TypeError('Invalid JSON Web Signature Payload.');
    }

    this.header = new JsonWebSignatureHeader(header);

    if (typeof payload === 'string') {
      this.payload = Buffer.from(payload, 'utf8');
    } else if (Buffer.isBuffer(payload)) {
      this.payload = payload;
    } else {
      this.payload = Buffer.alloc(0);
    }
  }

  /**
   * Deserializes a JSON Web Signature Compact Token.
   *
   * @param token JSON Web Signature Compact Token to be Deserialized.
   * @param key JSON Web Key used to verify the Signature of the JSON Web Signature Compact Token.
   * @returns JSON Web Signature containing the Deserialized JSON Web Signature Header and Payload.
   */
  public static async deserializeCompact(token: string, key: Nullable<JsonWebKey>): Promise<JsonWebSignature> {
    if (typeof token !== 'string') {
      throw new InvalidJsonWebSignatureException();
    }

    if (key !== null && !(key instanceof JsonWebKey)) {
      throw new InvalidJsonWebKeyException();
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
      const message = Buffer.from(`${b64Header}.${b64Payload}`, 'utf8');

      const algorithm = JSON_WEB_SIGNATURE_ALGORITHMS_REGISTRY[header.alg];

      await algorithm.verify(signature, message, key ?? undefined);

      return new JsonWebSignature(header, payload);
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
