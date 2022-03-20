import { Optional } from '@guarani/types';

import { InvalidJsonWebKeySetException } from '../exceptions/invalid-json-web-key-set.exception';
import { JoseException } from '../exceptions/jose.exception';
import { JsonWebKeyNotFoundException } from '../exceptions/json-web-key-not-found.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JSON_WEB_KEY_ALGORITHMS_REGISTRY } from '../jwk/algorithms/jsonwebkey-algorithms-registry';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebKeyParams } from '../jwk/jsonwebkey.params';
import { JsonWebKeySetParams } from './jsonwebkeyset.params';

/**
 * Implementation of RFC 7517.
 *
 * The JSON Web Key Set is a collection of JSON Web Keys, providing a pool of keys accepted by the application.
 * It is useful when there are multiple keys, each one having a specific usage.
 *
 * In order to be added into a JSON Web Key Set, the JSON Web Key **MUST** have a unique Key Identifier.
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
    const alg = JSON_WEB_KEY_ALGORITHMS_REGISTRY[params.kty!];

    if (alg === undefined) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Key Type "${params.kty}".`);
    }

    return new alg(params);
  }

  /**
   * Parses a JSON String into a JSON Web Key Set.
   *
   * @param data JSON String representation of the JSON Web Key Set to be parsed.
   * @returns Instance of a JSON Web Key Set based on the provided JSON String.
   */
  public static parse(data: string): JsonWebKeySet {
    try {
      const params: JsonWebKeySetParams = JSON.parse(data);

      if (!Array.isArray(params.keys)) {
        throw new InvalidJsonWebKeySetException();
      }

      if (params.keys.some((key) => !JsonWebKey.isJsonWebKey(key))) {
        throw new InvalidJsonWebKeySetException();
      }

      const keys = params.keys.map(this._loadJsonWebKey);

      return new JsonWebKeySet(keys);
    } catch (exc: any) {
      if (exc instanceof InvalidJsonWebKeySetException) {
        throw exc;
      }

      if (exc instanceof JoseException) {
        throw new InvalidJsonWebKeySetException(exc);
      }

      throw new InvalidJsonWebKeySetException(null, exc);
    }
  }

  /**
   * Finds and returns a JSON Web Key based on the provided parameters.
   *
   * @param params Parameters of the requested JSON Web Key.
   * @returns JSON Web Key based on the required Parameters.
   */
  public getKeyOrNone(params: JsonWebKeyParams): Optional<JsonWebKey> {
    return this.keys.find((key) => Object.entries(params).every(([attr, value]) => Reflect.get(key, attr) === value));
  }

  /**
   * Returns a JSON Web Key based on the provided parameters, otherwise, throws an Exception.
   *
   * @param params JSON Web Key containing the required Parameters.
   * @throws {JsonWebKeyNotFoundException} The requested JSON Web Key is not registered at the JSON Web Key Set.
   * @returns JSON Web Key based on the required Parameters.
   */
  public getKeyOrThrow(params: JsonWebKeyParams): JsonWebKey {
    const key = this.getKeyOrNone(params);

    if (key === undefined) {
      throw new JsonWebKeyNotFoundException();
    }

    return key;
  }
}
