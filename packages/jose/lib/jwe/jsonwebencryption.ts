import { Optional } from '@guarani/types';

import { randomBytes } from 'crypto';
import { promisify } from 'util';

import { InvalidJsonWebEncryptionException } from '../exceptions/invalid-json-web-encryption.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY } from './algorithm/alg/jsonwebencryption-keywrap-algorithms-registry';
import { JsonWebEncryptionKeyWrapAlgorithm } from './algorithm/alg/jsonwebencryption-keywrap.algorithm';
import { JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY } from './algorithm/enc/jsonwebencryption-contentencryption-algorithms-registry';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './algorithm/enc/jsonwebencryption-contentencryption.algorithm';
import { JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY } from './algorithm/zip/jsonwebencryption-compression-algorithms-registry';
import { JsonWebEncryptionHeaderParams } from './jsonwebencryption-header.params';
import { JsonWebEncryptionHeader } from './jsonwebencryption.header';
import { CompactDecodeParams } from './types/compact-decode.params';

const randomBytesAsync = promisify(randomBytes);

/**
 * Implementation of RFC 7516.
 *
 * The **JSON Web Encryption** is used for transporting encrypted data on the network,
 * providing confidentiality of the information.
 *
 * This implementation provides a set of attributes to represent the state of the information,
 * as well as segregating the header from the plaintext, which in turn facilitates the use of any of them.
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
   * @param plaintext Buffer encoded Plaintext.
   */
  public constructor(header: JsonWebEncryptionHeaderParams, plaintext?: Optional<Buffer>) {
    if (plaintext !== undefined && !Buffer.isBuffer(plaintext)) {
      throw new TypeError('Invalid JSON Web Encryption Plaintext.');
    }

    this.header = new JsonWebEncryptionHeader(header);
    this.plaintext = plaintext ?? Buffer.alloc(0);
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
   * Decodes a JSON Web Encryption Compact Token.
   *
   * @param token JSON Web Encryption Compact Token to be Decoded.
   * @param wrapKey JSON Web Key used to Unwrap the Encrypted Key.
   * @returns JSON Web Encryption containing the Decoded JSON Web Encryption Header and Plaintext.
   */
  public static async deserializeCompact(token: string, wrapKey: JsonWebKey): Promise<JsonWebEncryption> {
    try {
      const { aad, ciphertext, ek, header, iv, tag } = this.decodeCompact(token);

      const alg = JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY[header.alg];
      const enc = JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY[header.enc];
      const zip = header.zip !== undefined ? JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY[header.zip] : null;

      const cek = await alg.unwrap(ek, wrapKey, header);
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

  private async generateContentEncryptionKey(
    key: JsonWebKey,
    alg: JsonWebEncryptionKeyWrapAlgorithm,
    enc: JsonWebEncryptionContentEncryptionAlgorithm
  ): Promise<Buffer> {
    return this.header.alg === 'dir'
      ? <Buffer>(<unknown>key.export({ encoding: 'buffer' }))
      : await alg.generateContentEncryptionKey(enc.cekSize);
  }

  /**
   * Serializes the contents of the JSON Web Encryption into a Compact Token.
   *
   * @param key JSON Web Key used to Serialize the JSON Web Encryption.
   * @returns JSON Web Encryption Token.
   */
  public async serializeCompact(key: JsonWebKey): Promise<string> {
    let { header, plaintext } = this;

    const alg = JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY[header.alg];
    const enc = JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY[header.enc];
    const zip = header.zip !== undefined ? JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY[header.zip] : null;

    const cek = await this.generateContentEncryptionKey(key, alg, enc);
    const iv = await randomBytesAsync(enc.ivSize);

    const { ek, additionalHeaderParams } = await alg.wrap(key, cek);

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
