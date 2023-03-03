import { removeUndefined } from '@guarani/primitives';

import { InvalidJsonWebKeySetException } from '../exceptions/invalid-jsonwebkeyset.exception';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebKeyParameters } from '../jwk/jsonwebkey.parameters';
import { JsonWebKeySetParameters } from './jsonwebkeyset.parameters';

/**
 * Implementation of a JSON Web Key Set.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7517.html#section-5
 */
export class JsonWebKeySet implements JsonWebKeySetParameters {
  /**
   * JSON Web Keys registered at the JSON Web Key Set.
   */
  public readonly keys!: JsonWebKey[];

  /**
   * Instantiates a new JSON Web Key Set based on the provided JSON Web Keys.
   *
   * @param keys JSON Web Keys to be registered at the JSON Web Key Set.
   */
  public constructor(keys: JsonWebKey[]) {
    if (!Array.isArray(keys) || keys.length === 0 || keys.some((key) => !(key instanceof JsonWebKey))) {
      throw new TypeError('Invalid parameter "keys".');
    }

    keys.forEach((key) => (key.kid ??= key.thumbprint.toString('base64url')));

    const identifiers = keys.map((key) => key.kid);

    if (new Set(identifiers).size !== identifiers.length) {
      throw new InvalidJsonWebKeySetException('The use of duplicate Key Identifiers is forbidden.');
    }

    this.keys = keys;
  }

  /**
   * Loads the provided Parameters into a JSON Web Key Set.
   *
   * @param parameters Parameters of the JSON Web Key Set.
   * @returns JSON Web Key Set based on the provided Parameters.
   */
  public static async load(parameters: JsonWebKeySetParameters): Promise<JsonWebKeySet> {
    if (typeof parameters !== 'object' || parameters === null) {
      throw new InvalidJsonWebKeySetException();
    }

    if (!Array.isArray(parameters.keys) || parameters.keys.length === 0) {
      throw new InvalidJsonWebKeySetException('Invalid jwks parameter "keys".');
    }

    const keys = await Promise.all(
      parameters.keys.map(async (keyParameters) => {
        try {
          return await JsonWebKey.load(keyParameters);
        } catch (exc: unknown) {
          const exception = new InvalidJsonWebKeySetException(
            'The provided data is not a valid JSON Web Key Set object.'
          );

          exception.cause = exc;
          throw exception;
        }
      })
    );

    return new JsonWebKeySet(keys);
  }

  /**
   * Parses a JSON String into a JSON Web Key Set.
   *
   * @param data JSON String representation of the JSON Web Key Set to be parsed.
   * @returns Instance of a JSON Web Key Set based on the provided JSON String.
   */
  public static async parse(data: string): Promise<JsonWebKeySet> {
    try {
      return await this.load(JSON.parse(data));
    } catch (exc: unknown) {
      if (exc instanceof InvalidJsonWebKeySetException) {
        throw exc;
      }

      const exception = new InvalidJsonWebKeySetException();
      exception.cause = exc;
      throw exception;
    }
  }

  /**
   * Finds and returns a JSON Web Key that satisfies the provided predicate.
   *
   * @param predicate Predicate used to locate the requested JSON Web Key.
   * @returns JSON Web Key that satisfies the provided predicate.
   */
  public find<T extends JsonWebKey>(predicate: (key: JsonWebKeyParameters) => boolean): T | null {
    return <T>this.keys.find(predicate) ?? null;
  }

  /**
   * Returns the Parameters of the JSON Web Key Set.
   *
   * @param exportPublic Exports only the Public Parameters of the JSON Web Keys.
   */
  public toJSON(exportPublic = true): JsonWebKeySetParameters {
    return removeUndefined<JsonWebKeySetParameters>({ keys: this.keys.map((key) => key.toJSON(exportPublic)) });
  }
}
