import { Optional } from '@guarani/types';

import { InvalidJsonWebEncryptionException } from '../exceptions/invalid-json-web-encryption.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY } from './algorithms/alg/jsonwebencryption-keywrap-algorithms-registry';
import { JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY } from './algorithms/enc/jsonwebencryption-contentencryption-algorithms-registry';
import { JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY } from './algorithms/zip/jsonwebencryption-compression-algorithms-registry';
import { JsonWebEncryptionHeaderParams } from './jsonwebencryption-header.params';
import { JsonWebEncryptionHeader } from './jsonwebencryption.header';
import { CompactDecodeParams } from './types/compact-decode.params';

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7516.html RFC 7516}.
 */
export class JsonWebEncryption {
  /**
   * Header of the JSON Web Encryption.
   */
  public readonly header: JsonWebEncryptionHeader;

  /**
   * Plaintext of the JSON Web Encryption.
   */
  public readonly plaintext: Buffer;

  /**
   * Instantiates a new JSON Web Encryption based on the provided JSON Web Encryption Header and Plaintext.
   *
   * @param header JSON Web Encryption Header.
   * @param plaintext Buffer to be used as the Plaintext.
   */
  public constructor(header: JsonWebEncryptionHeaderParams, plaintext?: Optional<Buffer>) {
    if (plaintext !== undefined && !Buffer.isBuffer(plaintext)) {
      throw new TypeError('Invalid JSON Web Encryption Plaintext.');
    }

    this.header = new JsonWebEncryptionHeader(header);
    this.plaintext = Buffer.isBuffer(plaintext) ? plaintext : Buffer.alloc(0);
  }

  /**
   * Decodes the provided JSON Web Encryption Token and returns its parsed Parameters.
   *
   * @param token JSON Web Encryption Token to be Decoded.
   * @returns Parsed Parameters of the JSON Web Encryption Token.
   */
  private static decodeCompact(token: string): CompactDecodeParams {
    const splitToken = token.split('.');

    if (splitToken.length !== 5) {
      throw new InvalidJsonWebEncryptionException();
    }

    const [b64Header, b64Ek, b64Iv, b64Ciphertext, b64Tag] = splitToken;

    const header = new JsonWebEncryptionHeader(JSON.parse(Buffer.from(b64Header, 'base64url').toString('utf8')));
    const ek = Buffer.from(b64Ek, 'base64url');
    const iv = Buffer.from(b64Iv, 'base64url');
    const ciphertext = Buffer.from(b64Ciphertext, 'base64url');
    const tag = Buffer.from(b64Tag, 'base64url');
    const aad = Buffer.from(b64Header, 'ascii');

    return { aad, ciphertext, ek, header, iv, tag };
  }

  /**
   * Deserializes a JSON Web Encryption Compact Token.
   *
   * @param token JSON Web Encryption Compact Token to be Deserialized.
   * @param key JSON Web Key used to Deserialize the JSON Web Encryption Compact Token.
   * @returns JSON Web Encryption containing the Deserialized JSON Web Encryption Header and Plaintext.
   */
  public static async deserializeCompact(token: string, key: JsonWebKey): Promise<JsonWebEncryption> {
    try {
      const { aad, ciphertext, ek, header, iv, tag } = this.decodeCompact(token);

      const alg = JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY[header.alg];
      const enc = JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY[header.enc];
      const zip = header.zip !== undefined ? JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY[header.zip] : null;

      const cek = await alg.unwrap(enc, key, ek, header);
      let plaintext = await enc.decrypt(ciphertext, aad, iv, tag, cek);

      if (zip !== null) {
        plaintext = await zip.decompress(plaintext);
      }

      return new JsonWebEncryption(header, plaintext);
    } catch (exc: any) {
      if (exc instanceof InvalidJsonWebEncryptionException) {
        throw exc;
      }

      throw exc instanceof JoseException
        ? new InvalidJsonWebEncryptionException(exc)
        : new InvalidJsonWebEncryptionException(null, exc);
    }
  }

  /**
   * Serializes the JSON Web Encryption into a Compact Token.
   *
   * @param key JSON Web Key used to Serialize the JSON Web Encryption.
   * @returns JSON Web Encryption Compact Token.
   */
  public async serializeCompact(key: JsonWebKey): Promise<string> {
    let { header, plaintext } = this;

    const alg = JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY[header.alg];
    const enc = JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY[header.enc];
    const zip = header.zip !== undefined ? JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY[header.zip] : null;

    const iv = await enc.generateInitializationVector();

    const { cek, ek, additionalHeaderParams } = await alg.wrap(enc, key);

    if (additionalHeaderParams !== undefined) {
      Object.assign(header, additionalHeaderParams);
    }

    const b64Header = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
    const aad = Buffer.from(b64Header, 'ascii');

    if (zip !== null) {
      plaintext = await zip.compress(plaintext);
    }

    const { ciphertext, tag } = await enc.encrypt(plaintext, aad, iv, cek);

    const b64Ek = ek.toString('base64url');
    const b64Iv = iv.toString('base64url');
    const b64Ciphertext = ciphertext.toString('base64url');
    const b64Tag = tag.toString('base64url');

    return `${b64Header}.${b64Ek}.${b64Iv}.${b64Ciphertext}.${b64Tag}`;
  }
}
