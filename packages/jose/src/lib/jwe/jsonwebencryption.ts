import { Buffer } from 'buffer';

import { InvalidJsonWebEncryptionException } from '../exceptions/invalid-jsonwebencryption.exception';
import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKeyLoader } from '../jsonwebkey-loader.type';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebEncryptionHeader } from './jsonwebencryption.header';
import { JsonWebEncryptionHeaderParameters } from './jsonwebencryption.header.parameters';
import { JsonWebEncryptionParameters } from './jsonwebencryption.parameters';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-content-encryption-algorithm.type';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap-algorithm.type';

type SplitJsonWebEncryptionToken = [string, string, string, string, string];

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
    if (typeof plaintext !== 'undefined' && !Buffer.isBuffer(plaintext)) {
      throw new TypeError('Invalid JSON Web Encryption Plaintext.');
    }

    this.header = new JsonWebEncryptionHeader(header);
    this.plaintext = Buffer.isBuffer(plaintext) ? plaintext : Buffer.alloc(0);
  }

  /**
   * Checks if the provided data has a valid JSON Web Encryption Compact Serialization format.
   *
   * @param data Data to be checked.
   */
  public static isJsonWebEncryption(data: unknown): boolean {
    if (typeof data !== 'string') {
      return false;
    }

    const splitToken = data.split('.') as SplitJsonWebEncryptionToken;

    return splitToken.length === 5 && splitToken.every((component) => component.length !== 0);
  }

  /**
   * Decodes the provided JSON Web Encryption Token and returns its parsed Parameters.
   *
   * @example
   *
   * const { header, ek, iv, ciphertext, tag, aad } = JsonWebEncryption.decode('eyJhbGciOiJBMTI4...');
   *
   * @param token JSON Web Encryption Token to be Decoded.
   * @returns Parsed Parameters of the JSON Web Encryption Token.
   */
  public static decode(token: string): JsonWebEncryptionParameters {
    if (!JsonWebEncryption.isJsonWebEncryption(token)) {
      throw new InvalidJsonWebEncryptionException();
    }

    try {
      const [b64Header, b64Ek, b64Iv, b64Ciphertext, b64Tag] = token.split('.') as SplitJsonWebEncryptionToken;

      const headerParameters = JSON.parse(Buffer.from(b64Header, 'base64url').toString('utf8'));

      const header = new JsonWebEncryptionHeader(headerParameters);
      const ek = Buffer.from(b64Ek, 'base64url');
      const iv = Buffer.from(b64Iv, 'base64url');
      const ciphertext = Buffer.from(b64Ciphertext, 'base64url');
      const tag = Buffer.from(b64Tag, 'base64url');
      const aad = Buffer.from(b64Header, 'ascii');

      return { header, ek, iv, ciphertext, tag, aad };
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
   * @param expectedKeyWrapAlgorithms JSON Web Encryption Key Wrap Algorithms expected to be defined by the Header.
   * @param expectedContentEncryptionAlgorithms JSON Web Encryption Content Encryption Algorithms expected to be defined by the Header.
   * @returns JSON Web Encryption containing the Deserialized JSON Web Encryption Header and Plaintext.
   */
  public static async decrypt(
    token: string,
    keyOrKeyLoader: JsonWebKey | JsonWebKeyLoader,
    expectedKeyWrapAlgorithms: JsonWebEncryptionKeyWrapAlgorithm[],
    expectedContentEncryptionAlgorithms: JsonWebEncryptionContentEncryptionAlgorithm[]
  ): Promise<JsonWebEncryption> {
    if (!(keyOrKeyLoader instanceof JsonWebKey) && typeof keyOrKeyLoader !== 'function') {
      throw new InvalidJsonWebKeyException();
    }

    const { header, ek, iv, ciphertext, tag, aad } = JsonWebEncryption.decode(token);

    const { compressionBackend, contentEncryptionBackend, keyWrapBackend } = header;

    try {
      if (!expectedKeyWrapAlgorithms.includes(header.alg)) {
        throw new InvalidJsonWebEncryptionException(
          `The JSON Web Encryption Key Wrap Algorithm "${header.alg}" does not match the expected algorithms.`
        );
      }

      if (!expectedContentEncryptionAlgorithms.includes(header.enc)) {
        throw new InvalidJsonWebEncryptionException(
          `The JSON Web Encryption Content Encryption Algorithm "${header.enc}" does not match the expected algorithms.`
        );
      }

      const key = keyOrKeyLoader instanceof JsonWebKey ? keyOrKeyLoader : await keyOrKeyLoader(header);

      if (key === null) {
        throw new InvalidJsonWebEncryptionException('The provided unwrap key is invalid.');
      }

      const cek = await keyWrapBackend.unwrap(contentEncryptionBackend, key, ek, header);

      let plaintext = await contentEncryptionBackend.decrypt(ciphertext, aad, iv, tag, cek);

      if (compressionBackend !== null) {
        plaintext = await compressionBackend.decompress(plaintext);
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
   * @param keyOrKeyLoader JSON Web Key used to Serialize the JSON Web Encryption.
   * @returns JSON Web Encryption Compact Token.
   */
  public async encrypt(keyOrKeyLoader: JsonWebKey | JsonWebKeyLoader): Promise<string> {
    try {
      let { header, plaintext } = this;

      const { compressionBackend, contentEncryptionBackend, keyWrapBackend } = header;

      const key = keyOrKeyLoader instanceof JsonWebKey ? keyOrKeyLoader : await keyOrKeyLoader(header);

      if (key === null) {
        throw new InvalidJsonWebEncryptionException('The provided wrap key is invalid.');
      }

      const iv = await contentEncryptionBackend.generateInitializationVector();

      const [cek, ek, additionalHeaderParams] = await keyWrapBackend.wrap(contentEncryptionBackend, key, header);

      if (typeof additionalHeaderParams !== 'undefined') {
        Object.assign(header, additionalHeaderParams);
      }

      const b64Header = Buffer.from(JSON.stringify(header), 'utf8').toString('base64url');
      const aad = Buffer.from(b64Header, 'ascii');

      if (compressionBackend !== null) {
        plaintext = await compressionBackend.compress(plaintext);
      }

      const [ciphertext, tag] = await contentEncryptionBackend.encrypt(plaintext, aad, iv, cek);

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
