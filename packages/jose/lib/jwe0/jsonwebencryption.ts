import b64Url from '@guarani/base64url';

import { InvalidJoseHeader, InvalidJsonWebEncryption, JoseError } from '../exceptions';
import { JsonWebKey } from '../jwk';
import { KeyLoader } from '../types';
import { JWECompression, JWE_ALGORITHMS, JWE_COMPRESSIONS, JWE_ENCRYPTIONS } from './algorithms';
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
      throw new InvalidJoseHeader();
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
      throw new InvalidJsonWebEncryption();
    }

    const splitToken = token.split('.');

    if (splitToken.length !== 5) {
      throw new InvalidJsonWebEncryption();
    }

    try {
      const [b64Header, b64Ek, b64Iv, b64Ciphertext, b64Tag] = splitToken;

      const decodedHeader = b64Url.decode(b64Header, String);
      const parsedHeader = <JWEHeaderParams>JSON.parse(decodedHeader);

      const header = new JsonWebEncryptionHeader(parsedHeader);
      const ek = b64Url.decode(b64Ek, Buffer);
      const iv = b64Url.decode(b64Iv, Buffer);
      const ciphertext = b64Url.decode(b64Ciphertext, Buffer);
      const tag = b64Url.decode(b64Tag, Buffer);
      const aad = Buffer.from(b64Header, 'ascii');

      return [header, ek, iv, ciphertext, tag, aad];
    } catch (error) {
      if (error instanceof InvalidJsonWebEncryption) {
        throw error;
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebEncryption(error.message);
      }

      throw new InvalidJsonWebEncryption();
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

      const alg = JWE_ALGORITHMS[header.alg];
      const enc = JWE_ENCRYPTIONS[header.enc];

      const wrapKey = typeof jwkOrKeyLoader === 'function' ? jwkOrKeyLoader(header) : jwkOrKeyLoader;

      if (wrapKey != null && !(wrapKey instanceof JsonWebKey)) {
        throw new InvalidJsonWebEncryption('Invalid key.');
      }

      const cek = await alg.unwrap(ek, wrapKey, header);
      let plaintext = await enc.decrypt(ciphertext, aad, iv, tag, cek);

      if (header.zip != null) {
        const zip = <JWECompression>JWE_COMPRESSIONS[header.zip];
        plaintext = await zip.decompress(plaintext);
      }

      return new JsonWebEncryption(header, plaintext);
    } catch (error) {
      if (error instanceof InvalidJsonWebEncryption) {
        throw error;
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebEncryption(error.message);
      }

      throw new InvalidJsonWebEncryption();
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
      throw new InvalidJoseHeader(
        'This JSON Web Encryption cannot be serialized ' + 'using the JWE Compact Serialization.'
      );
    }

    if (wrapKey == null && this.header.alg !== 'dir') {
      throw new InvalidJoseHeader(`The algorithm "${this.header.alg}" requires the use of a JSON Web Key.`);
    }

    const alg = JWE_ALGORITHMS[this.header.alg];
    const enc = JWE_ENCRYPTIONS[this.header.enc];
    const zip = <JWECompression>JWE_COMPRESSIONS[this.header.zip!];

    const cek = await enc.generateCEK();
    const iv = await enc.generateIV();

    const { ek, header } = await alg.wrap(cek, wrapKey);

    if (header) {
      Object.assign(this.header, header);
    }

    const b64Header = b64Url.encode(JSON.stringify(this.header));
    const aad = Buffer.from(b64Header, 'ascii');

    const plaintext = zip != null ? await zip.compress(this.plaintext) : this.plaintext;

    const { ciphertext, tag } = await enc.encrypt(plaintext, aad, iv, cek);
    const b64IV = b64Url.encode(iv);

    return `${b64Header}.${ek}.${b64IV}.${ciphertext}.${tag}`;
  }
}
