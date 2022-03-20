import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { InvalidJsonWebEncryptionException } from '../exceptions/invalid-json-web-encryption.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY } from '../jwe/algorithm/alg/jsonwebencryption-keywrap-algorithms-registry';
import { JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY } from '../jwe/algorithm/enc/jsonwebencryption-contentencryption-algorithms-registry';
import { JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY } from '../jwe/algorithm/zip/jsonwebencryption-compression-algorithms-registry';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { KeyLoader } from '../types';
import { JsonWebEncryptionHeader, JWEHeaderParams } from './jsonwebencryption.header';

/**
 * Implementation of RFC 7516.
 *
 * The **JSON Web Encryption** is used for transporting encrypted data
 * on the network, providing confidentiality of the information.
 *
 * This implementation provides a set of attributes to represent the state
 * of the information, as well as segregating the header from the payload,
 * which in turn facilitates the use of any of them.
 */
export class JsonWebEncryption {
  /**
   * JOSE Header containing the meta information of the token.
   */
  public readonly header: JsonWebEncryptionHeader;

  /**
   * Buffer representation of the plaintext to be encrypted.
   */
  public readonly plaintext: Buffer;

  /**
   * Instantiates a new JSON Web Encryption based on the provided
   * JWE JOSE Header and plaintext.
   *
   * @param header JWE JOSE Header containing the token's meta information.
   * @param plaintext Buffer representation of the plaintext to be encrypted.
   */
  public constructor(header: JsonWebEncryptionHeader, plaintext: Buffer) {
    if (!(header instanceof JsonWebEncryptionHeader)) {
      throw new InvalidJoseHeaderException();
    }

    if (!Buffer.isBuffer(plaintext)) {
      throw new TypeError('The provided plaintext is invalid.');
    }

    this.header = header;
    this.plaintext = plaintext;
  }

  /**
   * Checks if the provided token is a JSON Web Encryption Token.
   *
   * @param token JSON Web Encryption Token to be checked.
   */
  public static isJWE(token: string): boolean {
    // Checks a Compact JWE token.
    if (typeof token === 'string') {
      const components = token.split('.');

      if (components.length !== 5) {
        return false;
      }

      if (components.some((component) => !component)) {
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Decodes the provided **JSON Web Encryption Compact Token** and returns its
   * parsed JWE Header, Encryption Key, Initialization Vector, Ciphertext,
   * Authentication Tag and Aditional Authenticated Data.
   *
   * @param token JSON Web Encryption Compact Token to be decoded.
   * @returns Components of the JSON Web Encryption Compact Token.
   */
  public static decodeCompact(token: string): [JsonWebEncryptionHeader, Buffer, Buffer, Buffer, Buffer, Buffer] {
    if (token == null || typeof token !== 'string') {
      throw new InvalidJsonWebEncryptionException();
    }

    const splitToken = token.split('.');

    if (splitToken.length !== 5) {
      throw new InvalidJsonWebEncryptionException();
    }

    try {
      const [b64Header, b64Ek, b64Iv, b64Ciphertext, b64Tag] = splitToken;

      const decodedHeader = Buffer.from(b64Header, 'base64url').toString('utf8');
      const parsedHeader = <JWEHeaderParams>JSON.parse(decodedHeader);

      const header = new JsonWebEncryptionHeader(parsedHeader);
      const ek = Buffer.from(b64Ek, 'base64url');
      const iv = Buffer.from(b64Iv, 'base64url');
      const ciphertext = Buffer.from(b64Ciphertext, 'base64url');
      const tag = Buffer.from(b64Tag, 'base64url');
      const aad = Buffer.from(b64Header, 'ascii');

      return [header, ek, iv, ciphertext, tag, aad];
    } catch (error) {
      if (error instanceof InvalidJsonWebEncryptionException) {
        throw error;
      }

      if (error instanceof JoseException) {
        throw new InvalidJsonWebEncryptionException(error.message);
      }

      throw new InvalidJsonWebEncryptionException();
    }
  }

  /**
   * Decodes a **JSON Web Encryption Compact Token**.
   *
   * @param token JSON Web Encryption Compact Token to be decoded.
   * @param wrapKey JSON Web Key used to unwrap the Encrypted Key.
   * @returns JSON Web Encryption containing the decoded JOSE Header and Plaintext.
   */
  public static async deserializeCompact(token: string, wrapKey: JsonWebKey): Promise<JsonWebEncryption>;

  /**
   * Decodes a **JSON Web Encryption Compact Token**.
   *
   * @param token JSON Web Encryption Compact Token to be decoded.
   * @param keyLoader Function used to load a JWK based on the JOSE Header.
   * @returns JSON Web Encryption containing the decoded JOSE Header and Plaintext.
   */
  public static async deserializeCompact(token: string, keyLoader: KeyLoader): Promise<JsonWebEncryption>;

  public static async deserializeCompact(
    token: string,
    jwkOrKeyLoader: JsonWebKey | KeyLoader
  ): Promise<JsonWebEncryption> {
    try {
      const [header, ek, iv, ciphertext, tag, aad] = this.decodeCompact(token);

      const alg = JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY[header.alg];
      const enc = JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY[header.enc];

      const wrapKey = typeof jwkOrKeyLoader === 'function' ? jwkOrKeyLoader(header) : jwkOrKeyLoader;

      if (wrapKey != null && !(wrapKey instanceof JsonWebKey)) {
        throw new InvalidJsonWebEncryptionException('Invalid key.');
      }

      const cek = await alg.unwrap(ek, wrapKey, header);
      let plaintext = await enc.decrypt(ciphertext, aad, iv, tag, cek);

      if (header.zip != null) {
        const zip = JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY[header.zip];
        plaintext = await zip.decompress(plaintext);
      }

      return new JsonWebEncryption(header, plaintext);
    } catch (error) {
      if (error instanceof InvalidJsonWebEncryptionException) {
        throw error;
      }

      if (error instanceof JoseException) {
        throw new InvalidJsonWebEncryptionException(error.message);
      }

      throw new InvalidJsonWebEncryptionException();
    }
  }

  /**
   * Serializes the contents of a JsonWebEncryption into a JWE Compact Token.
   *
   * It encodes the Header into a Base64Url version of its JSON representation,
   * and encodes the Encrypted Key, Initialization Vector, Ciphertext and
   * Authentication Tag into a Base64Url format, allowing the compatibility
   * in different systems.
   *
   * It creates a string message of the following format
   * (with break lines for display purposes only):
   *
   * `
   * Base64Url(UTF-8(header)).
   * Base64Url(Encrypted Key).
   * Base64Url(Initialization Vector).
   * Base64Url(Ciphertext).
   * Base64Url(Authentication Tag)
   * `
   *
   * The resulting token is then returned to the application.
   *
   * @param wrapKey JSON Web Key used to wrap the Content Encryption Key.
   * @returns JSON Web Encryption Compact Token.
   */
  public async serializeCompact(wrapKey?: JsonWebKey): Promise<string> {
    if (this.header == null) {
      throw new InvalidJoseHeaderException(
        'This JSON Web Encryption cannot be serialized ' + 'using the JWE Compact Serialization.'
      );
    }

    if (wrapKey == null && this.header.alg !== 'dir') {
      throw new InvalidJoseHeaderException(`The algorithm "${this.header.alg}" requires the use of a JSON Web Key.`);
    }

    const alg = JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY[this.header.alg];
    const enc = JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY[this.header.enc];
    const zip = JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY[this.header.zip!];

    const cek = await enc.generateContentEncryptionKey();
    const iv = await enc.generateInitializationVector();

    const { ek, additionalHeaderParams } = await alg.wrap(cek, wrapKey);

    if (additionalHeaderParams) {
      Object.assign(this.header, additionalHeaderParams);
    }

    const b64Header = Buffer.from(JSON.stringify(this.header), 'utf8').toString('base64url');
    const aad = Buffer.from(b64Header, 'ascii');

    const plaintext = zip != null ? await zip.compress(this.plaintext) : this.plaintext;

    const { ciphertext, tag } = await enc.encrypt(plaintext, aad, iv, cek);
    const b64IV = iv.toString('base64url');

    return `${b64Header}.${ek}.${b64IV}.${ciphertext}.${tag}`;
  }
}
