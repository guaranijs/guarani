import { Buffer } from 'buffer';

import { InvalidJsonWebEncryptionException } from '../exceptions/invalid-jsonwebencryption.exception';
import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKeyLoader } from '../jsonwebkey-loader.type';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebEncryptionHeader } from './jsonwebencryption.header';
import { JsonWebEncryptionHeaderParameters } from './jsonwebencryption.header.parameters';

/**
 * Implementation of a JSON Web Encryption.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7516.html
 */
export class JsonWebEncryption {
  /**
   * JSON Web Encryption Header.
   */
  public readonly header: JsonWebEncryptionHeader;

  /**
   * JSON Web Encryption Plaintext.
   */
  public readonly plaintext: Buffer;

  /**
   * Instantiates a new JSON Web Encryption based on the provided JSON Web Encryption Header and Plaintext.
   *
   * @param header JSON Web Encryption Header.
   * @param plaintext Buffer to be used as the Plaintext.
   */
  public constructor(header: JsonWebEncryptionHeaderParameters, plaintext?: Buffer) {
    if (plaintext !== undefined && !Buffer.isBuffer(plaintext)) {
      throw new TypeError('Invalid JSON Web Encryption Plaintext.');
    }

    this.header = new JsonWebEncryptionHeader(header);
    this.plaintext = Buffer.isBuffer(plaintext) ? plaintext : Buffer.alloc(0);
  }

  /**
   * Decodes the provided JSON Web Encryption Token and returns its parsed Parameters.
   *
   * @example
   *
   * const [header, ek, iv, ciphertext, tag, aad] = JsonWebEncryption.decode('eyJhbGciOiJBMTI4...');
   *
   * @param token JSON Web Encryption Token to be Decoded.
   * @returns Parsed Parameters of the JSON Web Encryption Token.
   */
  public static decode(token: string): [JsonWebEncryptionHeader, Buffer, Buffer, Buffer, Buffer, Buffer] {
    if (typeof token !== 'string') {
      throw new InvalidJsonWebEncryptionException();
    }

    const splitToken = token.split('.');

    if (splitToken.length !== 5) {
      throw new InvalidJsonWebEncryptionException();
    }

    try {
      const [b64Header, b64Ek, b64Iv, b64Ciphertext, b64Tag] = splitToken;

      const headerParameters = JSON.parse(Buffer.from(<string>b64Header, 'base64url').toString('utf8'));

      const header = new JsonWebEncryptionHeader(headerParameters);
      const ek = Buffer.from(<string>b64Ek, 'base64url');
      const iv = Buffer.from(<string>b64Iv, 'base64url');
      const ciphertext = Buffer.from(<string>b64Ciphertext, 'base64url');
      const tag = Buffer.from(<string>b64Tag, 'base64url');
      const aad = Buffer.from(<string>b64Header, 'ascii');

      return [header, ek, iv, ciphertext, tag, aad];
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebEncryptionException();
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Deserializes a JSON Web Encryption Compact Token.
   *
   * @param token JSON Web Encryption Compact Token to be Deserialized.
   * @param keyOrKeyLoader JSON Web Key used to Deserialize the JSON Web Encryption Compact Token.
   * @returns JSON Web Encryption containing the Deserialized JSON Web Encryption Header and Plaintext.
   */
  public static async decrypt(
    token: string,
    keyOrKeyLoader: JsonWebKey | JsonWebKeyLoader
  ): Promise<JsonWebEncryption> {
    if (!(keyOrKeyLoader instanceof JsonWebKey) && typeof keyOrKeyLoader !== 'function') {
      throw new InvalidJsonWebKeyException();
    }

    const [header, ek, iv, ciphertext, tag, aad] = this.decode(token);

    const key = typeof keyOrKeyLoader === 'function' ? await keyOrKeyLoader(header) : keyOrKeyLoader;

    try {
      const cek = await header.keyWrapBackend.unwrap(header.contentEncryptionBackend, key, ek, header);

      let plaintext = await header.contentEncryptionBackend.decrypt(ciphertext, aad, iv, tag, cek);

      if (header.compressionBackend !== undefined) {
        plaintext = await header.compressionBackend.decompress(plaintext);
      }

      return new JsonWebEncryption(header, plaintext);
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebEncryptionException();
      exception.cause = exc;

      throw exception;
    }
  }

  /**
   * Serializes the JSON Web Encryption into a Compact Token.
   *
   * @param key JSON Web Key used to Serialize the JSON Web Encryption.
   * @returns JSON Web Encryption Compact Token.
   */
  public async encrypt(key: JsonWebKey): Promise<string> {
    try {
      let { header, plaintext } = this;

      const iv = await header.contentEncryptionBackend.generateInitializationVector();

      const [cek, ek, additionalHeaderParams] = await header.keyWrapBackend.wrap(header.contentEncryptionBackend, key);

      if (additionalHeaderParams !== undefined) {
        Object.assign(header, additionalHeaderParams);
      }

      const b64Header = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
      const aad = Buffer.from(b64Header, 'ascii');

      if (header.compressionBackend !== undefined) {
        plaintext = await header.compressionBackend.compress(plaintext);
      }

      const [ciphertext, tag] = await header.contentEncryptionBackend.encrypt(plaintext, aad, iv, cek);

      const b64Ek = ek.toString('base64url');
      const b64Iv = iv.toString('base64url');
      const b64Ciphertext = ciphertext.toString('base64url');
      const b64Tag = tag.toString('base64url');

      return `${b64Header}.${b64Ek}.${b64Iv}.${b64Ciphertext}.${b64Tag}`;
    } catch (exc: unknown) {
      if (exc instanceof JoseException) {
        throw exc;
      }

      const exception = new InvalidJsonWebEncryptionException();
      exception.cause = exc;

      throw exception;
    }
  }
}
