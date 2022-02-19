import { Constructor, Dict, Nullable } from '@guarani/types'

import { InvalidJsonWebKeySetException } from '../exceptions'
import { EcKey, OctKey, RsaKey } from './algorithms'
import { JsonWebKey } from './jsonwebkey'

/**
 * Implementation of RFC 7517.
 *
 * The Json Web Key Set is a collection of Json Web Keys, providing a pool of
 * keys accepted by the application. It is useful when there are multiple keys,
 * each one having a specific usage.
 *
 * In order to be added into a key set, the key **MUST** have an ID,
 * via the `kid` parameter, since there **SHOULD NOT** be
 * any repeated keys within the set.
 */
export class JsonWebKeyset {
  /**
   * List of the JWKs of the Key Set.
   */
  public readonly keys: JsonWebKey[]

  /**
   * Instantiates a new JWK Set based on the provided JWKs.
   *
   * @param keys JWKs to be added to the Key Set.
   */
  public constructor(keys: JsonWebKey[]) {
    if (!Array.isArray(keys) || keys.length === 0) {
      throw new TypeError('Invalid parameter "keys".')
    }

    if (keys.some(key => !(key instanceof JsonWebKey))) {
      throw new InvalidJsonWebKeySetException()
    }

    const ids = keys.map(key => {
      if (key.kid == null) {
        throw new InvalidJsonWebKeySetException(
          'One or more keys do not have an ID.'
        )
      }

      return key.kid
    })

    if (new Set(ids).size !== ids.length) {
      throw new InvalidJsonWebKeySetException(
        'The usage of the same ID for multiple keys in a JWKS is forbidden.'
      )
    }

    this.keys = keys
  }

  /**
   * Parses a raw JSON Web Keyset into a JsonWebKeySet object.
   *
   * @param data Data of the JSON Web Keyset
   * @returns Parsed object representation of the provided JSON Web Keyset.
   */
  public static parse(data: any): JsonWebKeyset {
    if (typeof data !== 'object') {
      throw new InvalidJsonWebKeySetException()
    }

    if (data?.keys == null || !Array.isArray(data.keys)) {
      throw new InvalidJsonWebKeySetException()
    }

    const keys: any[] = data.keys
    const algs: Dict<Constructor<JsonWebKey>> = {
      EC: EcKey,
      oct: OctKey,
      RSA: RsaKey
    }

    if (keys.length === 0) {
      throw new InvalidJsonWebKeySetException()
    }

    const jwks = keys.map(key => {
      if (typeof key !== 'object' || key?.kty == null) {
        throw new InvalidJsonWebKeySetException()
      }

      if (key.kid == null) {
        throw new InvalidJsonWebKeySetException(
          'One or more keys do not have an ID.'
        )
      }

      return new algs[key.kty](key)
    })

    return new JsonWebKeyset(jwks)
  }

  /**
   * Returns a Key based on the requested ID.
   *
   * @param keyId ID of the Key to be retrieved.
   * @returns Key that matches the requested ID.
   */
  public getKey<T extends JsonWebKey>(keyId: string): Nullable<T> {
    return <T>this.keys.find(key => key.kid === keyId)
  }
}
