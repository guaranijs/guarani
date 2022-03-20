import b64Url from '@guarani/base64url';
import { removeNullishValues } from '@guarani/objects';
import { OneOrMany } from '@guarani/types';

import { InvalidJoseHeader, InvalidJsonWebSignature, InvalidKey, JoseError } from '../exceptions';
import { JsonWebKey } from '../jwk';
import { KeyLoader } from '../types';
import { JWS_ALGORITHMS, SupportedJWSAlgorithm } from './algorithms';
import { JsonWebSignatureHeader, JWSHeaderParams } from './jsonwebsignature.header';
import { JWSFlattenedSerialization, JWSJSONSerialization, JWSJSONSignature } from './_types';

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
   * JOSE Header containing the meta information of the token.
   */
  public readonly header: OneOrMany<JsonWebSignatureHeader>;

  /**
   * Buffer representation of the payload of the token.
   */
  public readonly payload?: Buffer;

  /**
   * Instantiates a new JSON Web Signature based on the provided
   * JWS JOSE Header and payload.
   *
   * @param header JWS JOSE Header containing the token's meta information.
   * @param payload Buffer representation of the payload of the token.
   */
  public constructor(header: JsonWebSignatureHeader, payload?: Buffer);

  /**
   * Instantiates a new JSON Web Signature based on the provided
   * JWS JOSE Headers and payload.
   *
   * @param headers JWS JOSE Headers containing the token's meta information.
   * @param payload Buffer representation of the payload of the token.
   */
  public constructor(headers: JsonWebSignatureHeader[], payload?: Buffer);

  public constructor(header: OneOrMany<JsonWebSignatureHeader>, payload?: Buffer) {
    if (!Array.isArray(header) && !(header instanceof JsonWebSignatureHeader)) {
      throw new InvalidJoseHeader();
    }

    if (payload != null && !Buffer.isBuffer(payload)) {
      throw new TypeError('The provided payload is invalid.');
    }

    this.header = header;
    this.payload = payload;
  }

  /**
   * Checks if the provided token is a JSON Web Signature Token.
   *
   * @param token JSON Web Signature Token to be checked.
   */
  public static isJWS(token: string): boolean {
    // Checks a Compact JWS token.
    if (typeof token === 'string') {
      const components = token.split('.');

      if (components.length !== 3) {
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
   * Decodes the provided **JSON Web Signature Compact Token** and returns its
   * parsed header and Base64Url decoded payload without checking the signature.
   *
   * @param token JSON Web Signature Compact Token to be decoded.
   * @returns Parsed JWS header and Base64Url decoded payload of the token.
   */
  public static decodeCompact(token: string): [JsonWebSignatureHeader, Buffer] {
    if (token == null || typeof token !== 'string') {
      throw new InvalidJsonWebSignature();
    }

    const splitToken = token.split('.');

    if (splitToken.length !== 3) {
      throw new InvalidJsonWebSignature();
    }

    try {
      const [b64Header, b64Payload] = splitToken;

      const parsedHeader = <JWSHeaderParams>JSON.parse(b64Url.decode(b64Header, Buffer).toString('utf8'));

      if (Array.isArray(parsedHeader)) {
        throw new InvalidJsonWebSignature("The token's JOSE Header is invalid.");
      }

      const header = new JsonWebSignatureHeader(parsedHeader);
      const payload = b64Url.decode(b64Payload, Buffer);

      return [header, payload];
    } catch (error) {
      if (error instanceof InvalidJsonWebSignature) {
        throw error;
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebSignature(error.message);
      }

      throw new InvalidJsonWebSignature();
    }
  }

  /**
   * Decodes a **JSON Web Signature Compact Token** checking
   * if its signature matches its content.
   *
   * Despite being optional, it is recommended to provide a **JWS Algorithm**
   * to prevent the `none attack` and the misuse of a public key as secret key.
   *
   * The algorithm specified at the header of the token
   * **MUST** match the provided algorithm, if any.
   *
   * If the JWS Algorithm `none` is expected, the JSON Web Key
   * can be **null** or **undefined**.
   *
   * @param token JSON Web Signature Compact Token to be decoded.
   * @param key JSON Web Key used to validate the signature of the Token.
   * @param algorithm Expected JWS Algorithm.
   * @returns JSON Web Signature containing the decoded JOSE Header and Payload.
   */
  public static async deserializeCompact(
    token: string,
    key: JsonWebKey,
    algorithm?: SupportedJWSAlgorithm
  ): Promise<JsonWebSignature>;

  /**
   * Decodes a **JSON Web Signature Compact Token** checking
   * if its signature matches its content.
   *
   * Despite being optional, it is recommended to provide a **JWS Algorithm**
   * to prevent the `none attack` and the misuse of a public key as secret key.
   *
   * The algorithm specified at the header of the token
   * **MUST** match the provided algorithm, if any.
   *
   * @param token JSON Web Signature Compact Token to be decoded.
   * @param keyLoader Function used to load a JWK based on the JOSE Header.
   * @param algorithm Expected JWS Algorithm.
   * @returns JSON Web Signature containing the decoded JOSE Header and Payload.
   */
  public static async deserializeCompact(
    token: string,
    keyLoader: KeyLoader,
    algorithm?: SupportedJWSAlgorithm
  ): Promise<JsonWebSignature>;

  public static async deserializeCompact(
    token: string,
    jwkOrKeyLoader: JsonWebKey | KeyLoader,
    algorithm?: SupportedJWSAlgorithm
  ): Promise<JsonWebSignature> {
    try {
      const [header, payload] = this.decodeCompact(token);
      const [b64Header, b64Payload, b64Signature] = token.split('.');

      const key = typeof jwkOrKeyLoader === 'function' ? jwkOrKeyLoader(header) : jwkOrKeyLoader;

      if (key != null && !(key instanceof JsonWebKey)) {
        throw new InvalidJsonWebSignature('Invalid key.');
      }

      if (algorithm && algorithm !== header.alg) {
        throw new InvalidJsonWebSignature(
          'The algorithm used to sign this token is invalid. ' + `Expected "${algorithm}", got "${header.alg}".`
        );
      }

      const alg = JWS_ALGORITHMS[header.alg];

      await alg.verify(b64Signature, Buffer.from(`${b64Header}.${b64Payload}`), key);

      return new JsonWebSignature(header, payload);
    } catch (error) {
      if (error instanceof InvalidJsonWebSignature) {
        throw error;
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebSignature(error.message);
      }

      throw new InvalidJsonWebSignature();
    }
  }

  /**
   * Decodes a **JSON Web Signature Flattened Token** checking
   * if its signature matches its content.
   *
   * Despite being optional, it is recommended to provide a **JWS Algorithm**
   * to prevent the `none attack` and the misuse of a public key as secret key.
   *
   * The algorithm specified at the header of the token
   * **MUST** match the provided algorithm, if any.
   *
   * If the JWS Algorithm `none` is expected, the JSON Web Key
   * can be **null** or **undefined**.
   *
   * @param token JSON Web Signature Flattened Token to be decoded.
   * @param key JSON Web Key used to validate the signature of the Token.
   * @param algorithm Expected JWS Algorithm.
   * @returns JSON Web Signature containing the decoded JOSE Header and Payload.
   */
  public static async deserializeFlattened(
    token: JWSFlattenedSerialization,
    key: JsonWebKey,
    algorithm?: SupportedJWSAlgorithm
  ): Promise<JsonWebSignature>;

  /**
   * Decodes a **JSON Web Signature Flattened Token** checking
   * if its signature matches its content.
   *
   * Despite being optional, it is recommended to provide a **JWS Algorithm**
   * to prevent the `none attack` and the misuse of a public key as secret key.
   *
   * The algorithm specified at the header of the token
   * **MUST** match the provided algorithm, if any.
   *
   * @param token JSON Web Signature Flattened Token to be decoded.
   * @param keyLoader Function used to load a JWK based on the JOSE Header.
   * @param algorithm Expected JWS Algorithm.
   * @returns JSON Web Signature containing the decoded JOSE Header and Payload.
   */
  public static async deserializeFlattened(
    token: JWSFlattenedSerialization,
    keyLoader: KeyLoader,
    algorithm?: SupportedJWSAlgorithm
  ): Promise<JsonWebSignature>;

  public static async deserializeFlattened(
    token: JWSFlattenedSerialization,
    jwkOrKeyLoader: JsonWebKey | KeyLoader,
    algorithm?: SupportedJWSAlgorithm
  ): Promise<JsonWebSignature> {
    if (token == null) {
      throw new InvalidJsonWebSignature();
    }

    const { payload: b64Payload } = token;

    if (b64Payload == null || typeof b64Payload !== 'string') {
      throw new InvalidJsonWebSignature('Invalid attribute "payload".');
    }

    try {
      const payload = b64Url.decode(b64Payload, Buffer);
      const header = await JsonWebSignature.getJWSJSONHeader(b64Payload, token, jwkOrKeyLoader, algorithm);

      return new JsonWebSignature(header, payload);
    } catch (error) {
      if (error instanceof InvalidJsonWebSignature) {
        throw error;
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebSignature(error.message);
      }

      throw new InvalidJsonWebSignature();
    }
  }

  /**
   * Decodes a **JSON Web Signature JSON Token** checking
   * if its signature matches its content.
   *
   * Despite being optional, it is recommended to provide a **JWS Algorithm**
   * to each JWS JOSE Header, in order to prevent the `none attack`
   * and the misuse of a public key as secret key.
   *
   * The algorithm specified at the header of the token
   * **MUST** match the provided algorithm, if any.
   *
   * If the JWS Algorithm `none` is expected in a JWS JOSE Header,
   * the JSON Web Key can be **null** or **undefined**.
   *
   * @param token JSON Web Signature JSON Token to be decoded.
   * @param keys JSON Web Keys used to validate the signatures of the Token.
   * @param algorithms Expected JWS Algorithms.
   * @returns JSON Web Signature containing the decoded JOSE Header and Payload.
   */
  public static async deserializeJSON(
    token: JWSJSONSerialization,
    keys: JsonWebKey[],
    algorithms?: SupportedJWSAlgorithm[]
  ): Promise<JsonWebSignature>;

  /**
   * Decodes a **JSON Web Signature JSON Token** checking
   * if its signature matches its content.
   *
   * Despite being optional, it is recommended to provide a **JWS Algorithm**
   * to each JWS JOSE Header, in order to prevent the `none attack`
   * and the misuse of a public key as secret key.
   *
   * The algorithm specified at the header of the token
   * **MUST** match the provided algorithm, if any.
   *
   * @param token JSON Web Signature JSON Token to be decoded.
   * @param keyLoader Function used to load a JWK based on the JOSE Header.
   * @param algorithms Expected JWS Algorithms.
   * @returns JSON Web Signature containing the decoded JOSE Header and Payload.
   */
  public static async deserializeJSON(
    token: JWSJSONSerialization,
    keyLoader: KeyLoader,
    algorithms?: SupportedJWSAlgorithm[]
  ): Promise<JsonWebSignature>;

  public static async deserializeJSON(
    token: JWSJSONSerialization,
    jwkOrKeyLoader: JsonWebKey[] | KeyLoader,
    algorithms?: SupportedJWSAlgorithm[]
  ): Promise<JsonWebSignature> {
    if (token == null) {
      throw new InvalidJsonWebSignature();
    }

    const { payload: b64Payload, signatures } = token;

    if (b64Payload == null || typeof b64Payload !== 'string') {
      throw new InvalidJsonWebSignature('Invalid attribute "payload".');
    }

    if (!Array.isArray(signatures)) {
      throw new InvalidJsonWebSignature('Invalid attribute "signatures".');
    }

    try {
      const payload = b64Url.decode(b64Payload, Buffer);
      const awaitableHeaders = signatures.map(async (signature, i) => {
        const key = typeof jwkOrKeyLoader === 'function' ? jwkOrKeyLoader : jwkOrKeyLoader[i];

        return await JsonWebSignature.getJWSJSONHeader(b64Payload, signature, key, algorithms?.[i]);
      });

      const headers = await Promise.all(awaitableHeaders);

      return new JsonWebSignature(headers, payload);
    } catch (error) {
      if (error instanceof InvalidJsonWebSignature) {
        throw error;
      }

      if (error instanceof JoseError) {
        throw new InvalidJsonWebSignature(error.message);
      }

      throw new InvalidJsonWebSignature();
    }
  }

  /**
   * Parses a JWS JSON Signature returning the corresponding JWS JOSE Header.
   *
   * @param b64Payload Payload of the Signature.
   * @param signature JWS JSON Signature to be parsed.
   * @param jwkOrKeyLoader JSON Web Key or JWK Loader Function.
   * @param algorithm Expected JWS Algorithm.
   * @returns Instance of a JsonWebSignatureHeader.
   */
  private static async getJWSJSONHeader(
    b64Payload: string,
    signature: JWSJSONSignature,
    jwkOrKeyLoader: JsonWebKey | KeyLoader,
    algorithm?: SupportedJWSAlgorithm
  ): Promise<JsonWebSignatureHeader> {
    const { signature: b64Signature, header: unprotectedHeader, protected: b64ProtectedHeader } = signature;

    if (typeof b64Signature !== 'string') {
      throw new InvalidJsonWebSignature('Invalid attribute "signature".');
    }

    if (b64ProtectedHeader && typeof b64ProtectedHeader !== 'string') {
      throw new InvalidJsonWebSignature('Invalid attribute "protected".');
    }

    const protectedHeader: JWSHeaderParams = JSON.parse(b64Url.decode(b64ProtectedHeader!, Buffer).toString('utf8'));

    const header = new JsonWebSignatureHeader({
      protectedHeader,
      unprotectedHeader,
    });

    if (algorithm && algorithm !== header.alg) {
      throw new InvalidJsonWebSignature(
        'The algorithm used to sign this token is invalid. ' + `Expected "${algorithm}", got "${header.alg}".`
      );
    }

    const alg = JWS_ALGORITHMS[header.alg];

    const key = typeof jwkOrKeyLoader === 'function' ? jwkOrKeyLoader(header) : jwkOrKeyLoader;

    await alg.verify(b64Signature, Buffer.from(`${b64ProtectedHeader}.${b64Payload}`), key);

    return header;
  }

  /**
   * Serializes the contents of a JsonWebSignature into a JWS Compact Token.
   *
   * It encodes the header into a Base64Url version of its JSON representation,
   * and encodes the payload into a Base64Url format, allowing the compatibility
   * of the payload in different systems.
   *
   * It creates a string message of the following format:
   *
   * `Base64Url(UTF-8(header)).Base64Url(payload)`
   *
   * It then signs the message using the provided key, and imbues the signature
   * into the message, resulting in the following token:
   *
   * `Base64Url(UTF-8(header)).Base64Url(payload).Base64Url(signature)`
   *
   * The resulting token is then returned to the application.
   *
   * @param key JSON Web Key used to sign the token.
   * @returns Signed JSON Web Signature Compact Token.
   */
  public async serializeCompact(key?: JsonWebKey): Promise<string> {
    if (Array.isArray(this.header)) {
      throw new InvalidJoseHeader(
        'This JSON Web Signature cannot be serialized ' + 'using the JWS Compact Serialization.'
      );
    }

    if (key == null && this.header.alg !== 'none') {
      throw new InvalidJoseHeader(`The algorithm "${this.header.alg}" requires the use of a JSON Web Key.`);
    }

    const b64Header = b64Url.encode(Buffer.from(JSON.stringify(this.header)));
    const b64Payload = b64Url.encode(this.payload ?? Buffer.alloc(0));

    const alg = JWS_ALGORITHMS[this.header.alg];

    const message = `${b64Header}.${b64Payload}`;
    const signature = await alg.sign(Buffer.from(message), key);

    return `${message}.${signature}`;
  }

  /**
   * Serializes the contents of a JsonWebSignature into a JWS JSON Flattened Token.
   *
   * It encodes the JWS Protected Header into a Base64Url version of its JSON
   * representation, and the payload into a Base64Url string.
   * The JWS Unprotected Header remains unencoded.
   *
   * The resulting Token is a JSON Object of the following format:
   *
   * ```json
   * {
   *   "payload": "eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0",
   *   "signature": "hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA",
   *   "protected": "eyJhbGciOiJIUzI1NiJ9",
   *   "header": { "kid": "key-id" }
   * }
   * ```
   *
   * @param key JSON Web Key used to generate the signature.
   * @returns JSON Web Signature Flattened Token.
   */
  public async serializeFlattened(key?: JsonWebKey): Promise<JWSFlattenedSerialization> {
    if (Array.isArray(this.header)) {
      throw new InvalidJoseHeader(
        'This JSON Web Signature cannot be serialized ' + 'using the JWS Flattened Serialization.'
      );
    }

    const b64Payload = b64Url.encode(this.payload ?? Buffer.alloc(0));
    const signature = await JsonWebSignature.serializeJSONSignature(this.header, b64Payload, key);

    return removeNullishValues<JWSFlattenedSerialization>({
      payload: b64Payload,
      ...signature,
    });
  }

  /**
   * Serializes the contents of a JsonWebSignature into a JWS JSON Token.
   *
   * **This overload is used when the same JWK is used for all the signatures.**
   *
   * It encodes each JWS Protected Header into a Base64Url version of its JSON
   * representation, and the payload into a Base64Url string.
   * All of the JWS Unprotected Headers remain unencoded.
   *
   * The resulting Token is a JSON Object of the following format:
   *
   * ```json
   * {
   *   "payload": "eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0",
   *   "signatures": [
   *     {
   *       "signature": "hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA",
   *       "header": { "kid": "tenant1-key3" },
   *       "protected": "eyJhbGciOiJIUzI1NiJ9"
   *     },
   *     {
   *       "signature": "hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA",
   *       "header": { "kid": "tenant2-key1" },
   *       "protected": "eyJhbGciOiJIUzI1NiJ9"
   *     }
   *   ]
   * }
   * ```
   *
   * @param key JSON Web Key used to generate the signature.
   * @returns JSON Web Signature JSON Token.
   */
  public async serializeJSON(key: JsonWebKey): Promise<JWSJSONSerialization>;

  /**
   * Serializes the contents of a JsonWebSignature into a JWS JSON Token.
   *
   * **This overload is used when each signature has its own JWK.**
   *
   * It encodes each JWS Protected Header into a Base64Url version of its JSON
   * representation, and the payload into a Base64Url string.
   * All of the JWS Unprotected Headers remain unencoded.
   *
   * The resulting Token is a JSON Object of the following format:
   *
   * ```json
   * {
   *   "payload": "eyJpYXQiOiAxNzIzMDEwNDU1LCAic3ViIjogIjA3OEJXRERYYXNkY2c4In0",
   *   "signatures": [
   *     {
   *       "signature": "hRqmKz7sKWQZyNM1Kw9AgqPNOedszPvEADYmNFo8foA",
   *       "header": { "kid": "oct1" },
   *       "protected": "eyJhbGciOiJIUzI1NiJ9"
   *     },
   *     {
   *       "signature": "GEvfsUYb61e4EM0yizl9Ym_VXy7d6WV_fQ38H1r-1uI",
   *       "header": { "kid": "oct2" },
   *       "protected": "eyJhbGciOiJIUzI1NiJ9"
   *     }
   *   ]
   * }
   * ```
   *
   * @param key List of JSON Web Keys used to generate the signatures.
   * @returns JSON Web Signature JSON Token.
   */
  public async serializeJSON(keys: JsonWebKey[]): Promise<JWSJSONSerialization>;

  public async serializeJSON(jwk: OneOrMany<JsonWebKey>): Promise<JWSJSONSerialization> {
    const b64payload = b64Url.encode(this.payload ?? Buffer.alloc(0));

    if (jwk == null) {
      throw new InvalidKey('The JSON Web Key parameter MUST be defined.');
    }

    if (!Array.isArray(this.header)) {
      throw new InvalidJoseHeader(
        'This JSON Web Signature cannot be serialized ' + 'using the JWS JSON Serialization.'
      );
    }

    if (Array.isArray(jwk) && this.header.length !== jwk.length) {
      throw new InvalidKey('The number of JSON Web Keys and JWS JOSE Headers MUST match.');
    }

    const signatures = await Promise.all(
      this.header.map<Promise<JWSJSONSignature>>(async (header, i) => {
        const key = Array.isArray(jwk) ? jwk[i] : jwk;

        return await JsonWebSignature.serializeJSONSignature(header, b64payload, key);
      })
    );

    return removeNullishValues<JWSJSONSerialization>({
      payload: b64payload,
      signatures,
    });
  }

  /**
   * Creates a JWS JSON Signature object based on the provided parameters.
   *
   * @param header JWS JOSE Header of the JWS JSON Signature.
   * @param b64Payload Base64Url Payload of the JWS JSON Signature.
   * @param key JSON Web Key used to sign the JWS JSON Signature.
   * @returns Serialized JWS JSON Signature.
   */
  private static async serializeJSONSignature(
    header: JsonWebSignatureHeader,
    b64Payload: string,
    key?: JsonWebKey
  ): Promise<JWSJSONSignature> {
    if (key == null && header.alg !== 'none') {
      throw new InvalidJoseHeader(`The algorithm "${header.alg}" requires the use of a JSON Web Key.`);
    }

    const b64Header = b64Url.encode(Buffer.from(JSON.stringify(header.protectedHeader) ?? ''));

    const alg = JWS_ALGORITHMS[header.alg];

    const message = `${b64Header}.${b64Payload}`;
    const signature = await alg.sign(Buffer.from(message), key);

    return {
      signature,
      header: header.unprotectedHeader,
      protected: b64Header || undefined,
    };
  }
}
