import { Optional } from '@guarani/types';

import { InvalidJsonWebKeySetException } from '../exceptions/invalid-json-web-key-set.exception';
import { JsonWebKeyNotFoundException } from '../exceptions/json-web-key-not-found.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JSON_WEB_KEY_ALGORITHMS_REGISTRY } from '../jwk/algorithms/jsonwebkey-algorithms-registry';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';
import { JsonWebKeySetParams } from './jsonwebkeyset.params';

/**
 * Implementation of {@link https://www.rfc-editor.org/rfc/rfc7517.html#section-5 RFC 7517}.
 */
export class JsonWebKeySet implements JsonWebKeySetParams {
  /**
   * JSON Web Keys registered at the JSON Web Key Set.
   */
  public readonly keys: JsonWebKey[];

  /**
   * Instantiates a new JSON Web Key Set based on the provided JSON Web Keys.
   *
   * @param keys JSON Web Keys to be registered at the JSON Web Key Set.
   */
  public constructor(keys: JsonWebKey[]) {
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new TypeError('Invalid parameter "keys".');
    }

    if (keys.some((key) => !(key instanceof JsonWebKey))) {
      throw new InvalidJsonWebKeySetException();
    }

    const identifiers = keys.map((key) => key.kid);

    identifiers.forEach((identifier, index) => {
      if (identifier === undefined) {
        throw new InvalidJsonWebKeySetException(
          `The JSON Web Key at position #${index} does not have a Key Identifier.`
        );
      }
    });

    if (new Set(identifiers).size !== identifiers.length) {
      throw new InvalidJsonWebKeySetException('The use of duplicate Key Identifiers is forbidden.');
    }

    this.keys = keys;
  }

  /**
   * Loads the data of the provided JSON Web Key Parameters into a JSON Web Key based on the Key Type.
   *
   * @param params Parameters of the JSON Web Key.
   * @returns JSON Web Key based on the Key Type of the provided Parameters.
   */
  private static _loadJsonWebKey(params: JsonWebKeyParams): JsonWebKey {
    if (params instanceof JsonWebKey) {
      return params;
    }

    const alg = JSON_WEB_KEY_ALGORITHMS_REGISTRY[params.kty!];

    if (alg === undefined) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Key Type "${params.kty}".`);
    }

    return new alg(params);
  }

  /**
   * Loads the provided Parameters into a JSON Web Key Set.
   *
   * @param params Parameters of the JSON Web Key Set.
   * @returns JSON Web Key Set based on the provided Parameters.
   */
  public static load(params: JsonWebKeySetParams): JsonWebKeySet {
    if (params instanceof JsonWebKeySet) {
      return params;
    }

    if (!Array.isArray(params.keys)) {
      throw new InvalidJsonWebKeySetException();
    }

    if (!Array.isArray(params.keys)) {
      throw new InvalidJsonWebKeySetException();
    }

    if (params.keys.some((key) => !JsonWebKey.isJsonWebKey(key))) {
      throw new InvalidJsonWebKeySetException();
    }

    const keys = params.keys.map(this._loadJsonWebKey);

    return new JsonWebKeySet(keys);
  }

  /**
   * Parses a JSON String into a JSON Web Key Set.
   *
   * @param data JSON String representation of the JSON Web Key Set to be parsed.
   * @returns Instance of a JSON Web Key Set based on the provided JSON String.
   */
  public static parse(data: string): JsonWebKeySet {
    let parsedData: JsonWebKeySetParams;

    try {
      parsedData = JSON.parse(data);
    } catch (exc: any) {
      throw new InvalidJsonWebKeySetException(null, exc);
    }

    return this.load(parsedData);
  }

  /**
   * Finds and returns a JSON Web Key based on the provided Parameters.
   *
   * @param params Parameters of the requested JSON Web Key.
   * @returns JSON Web Key based on the required Parameters.
   */
  public getKeyOrNone<T extends JsonWebKey>(params: JsonWebKeyParams): Optional<T> {
    const keyFinderFn = (key: JsonWebKey): boolean => {
      return Object.entries(params).every(([attr, value]) => Reflect.get(key, attr) === value);
    };

    return <T>this.keys.find(keyFinderFn);
  }

  /**
   * Returns a JSON Web Key based on the provided Parameters, otherwise, throws an Exception.
   *
   * @param params JSON Web Key containing the required Parameters.
   * @throws {JsonWebKeyNotFoundException} The requested JSON Web Key is not registered at the JSON Web Key Set.
   * @returns JSON Web Key based on the required Parameters.
   */
  public getKeyOrThrow<T extends JsonWebKey>(params: JsonWebKeyParams): T {
    const key = this.getKeyOrNone(params);

    if (key === undefined) {
      throw new JsonWebKeyNotFoundException();
    }

    return <T>key;
  }
}
