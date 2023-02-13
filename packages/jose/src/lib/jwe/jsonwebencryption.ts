import { Buffer } from 'buffer';

import { InvalidJsonWebEncryptionException } from '../exceptions/invalid-jsonwebencryption.exception';
import { InvalidJsonWebKeyException } from '../exceptions/invalid-jsonwebkey.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKeyLoader } from '../jsonwebkey-loader.type';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { A128KW, A192KW, A256KW } from './backends/alg/aes.backend';
import { dir } from './backends/alg/dir.backend';
import { A128GCMKW, A192GCMKW, A256GCMKW } from './backends/alg/gcm.backend';
import { JsonWebEncryptionKeyWrapBackend } from './backends/alg/jsonwebencryption-keywrap.backend';
import { RSA1_5, RSA_OAEP, RSA_OAEP_256, RSA_OAEP_384, RSA_OAEP_512 } from './backends/alg/rsa.backend';
import { A128CBC_HS256, A192CBC_HS384, A256CBC_HS512 } from './backends/enc/cbc.backend';
import { A128GCM, A192GCM, A256GCM } from './backends/enc/gcm.backend';
import { JsonWebEncryptionContentEncryptionBackend } from './backends/enc/jsonwebencryption-content-encryption.backend';
import { DEF } from './backends/zip/def.backend';
import { JsonWebEncryptionCompressionBackend } from './backends/zip/jsonwebencryption-compression.backend';
import { JsonWebEncryptionCompressionAlgorithm } from './jsonwebencryption-compression-algorithm.enum';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-content-encryption-algorithm.enum';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap-algorithm.enum';
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
   * Supported JSON Web Encryption Key Wrap Backends.
   */
  private static readonly keyWrapBackends: Record<JsonWebEncryptionKeyWrapAlgorithm, JsonWebEncryptionKeyWrapBackend> =
    {
      [JsonWebEncryptionKeyWrapAlgorithm.A128GCMKW]: A128GCMKW,
      [JsonWebEncryptionKeyWrapAlgorithm.A128KW]: A128KW,
      [JsonWebEncryptionKeyWrapAlgorithm.A192GCMKW]: A192GCMKW,
      [JsonWebEncryptionKeyWrapAlgorithm.A192KW]: A192KW,
      [JsonWebEncryptionKeyWrapAlgorithm.A256GCMKW]: A256GCMKW,
      [JsonWebEncryptionKeyWrapAlgorithm.A256KW]: A256KW,
      [JsonWebEncryptionKeyWrapAlgorithm.Dir]: dir,
      [JsonWebEncryptionKeyWrapAlgorithm.RSA1_5]: RSA1_5,
      [JsonWebEncryptionKeyWrapAlgorithm.RSA_OAEP]: RSA_OAEP,
      [JsonWebEncryptionKeyWrapAlgorithm.RSA_OAEP_256]: RSA_OAEP_256,
      [JsonWebEncryptionKeyWrapAlgorithm.RSA_OAEP_384]: RSA_OAEP_384,
      [JsonWebEncryptionKeyWrapAlgorithm.RSA_OAEP_512]: RSA_OAEP_512,
    };

  /**
   * Supported JSON Web Encryption Content Encryption Backends.
   */
  private static readonly contentEncryptionBackends: Record<
    JsonWebEncryptionContentEncryptionAlgorithm,
    JsonWebEncryptionContentEncryptionBackend
  > = {
    [JsonWebEncryptionContentEncryptionAlgorithm.A128CBC_HS256]: A128CBC_HS256,
    [JsonWebEncryptionContentEncryptionAlgorithm.A192CBC_HS384]: A192CBC_HS384,
    [JsonWebEncryptionContentEncryptionAlgorithm.A256CBC_HS512]: A256CBC_HS512,
    [JsonWebEncryptionContentEncryptionAlgorithm.A128GCM]: A128GCM,
    [JsonWebEncryptionContentEncryptionAlgorithm.A192GCM]: A192GCM,
    [JsonWebEncryptionContentEncryptionAlgorithm.A256GCM]: A256GCM,
  };

  /**
   * Supported JSON Web Encryption Compression Backends.
   */
  private static readonly compressionBackends: Record<
    JsonWebEncryptionCompressionAlgorithm,
    JsonWebEncryptionCompressionBackend
  > = {
    [JsonWebEncryptionCompressionAlgorithm.DEF]: DEF,
  };

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
      const keyWrapBackend = this.keyWrapBackends[header.alg];
      const contentEncryptionBackend = this.contentEncryptionBackends[header.enc];
      const compressionBackend = header.zip !== undefined ? this.compressionBackends[header.zip] : null;

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
   * @param key JSON Web Key used to Serialize the JSON Web Encryption.
   * @returns JSON Web Encryption Compact Token.
   */
  public async encrypt(key: JsonWebKey): Promise<string> {
    try {
      let { header, plaintext } = this;

      const keyWrapBackend = JsonWebEncryption.keyWrapBackends[header.alg];
      const contentEncryptionBackend = JsonWebEncryption.contentEncryptionBackends[header.enc];
      const compressionBackend = header.zip !== undefined ? JsonWebEncryption.compressionBackends[header.zip] : null;

      const iv = await contentEncryptionBackend.generateInitializationVector();

      const [cek, ek, additionalHeaderParams] = await keyWrapBackend.wrap(contentEncryptionBackend, key);

      if (additionalHeaderParams !== undefined) {
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
