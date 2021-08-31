import { InvalidKeySet } from '../exceptions'
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
export class JsonWebKeySet {
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
      throw new InvalidKeySet()
    }

    const ids = keys.map(key => key.kid)

    if (ids.some(id => !id)) {
      throw new InvalidKeySet('One or more keys do not have an ID.')
    }

    if (new Set(ids).size !== ids.length) {
      throw new InvalidKeySet(
        'The usage of the same ID for multiple keys in a JWKS is forbidden.'
      )
    }

    this.keys = keys
  }

  /**
   * Returns a Key based on the requested ID.
   *
   * @param keyId ID of the Key to be retrieved.
   * @returns Key that matches the requested ID.
   */
  public getKey<KeyType extends JsonWebKey>(keyId: string): KeyType {
    return this.keys.find(key => key.kid === keyId) as KeyType
  }
}
