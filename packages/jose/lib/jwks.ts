import { InvalidKeySet } from './exceptions'
import { JsonWebKey } from './jwk'

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
  public readonly keys: JsonWebKey[]

  public constructor (keys: JsonWebKey[]) {
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      throw new InvalidKeySet()
    }

    if (keys.some(key => !(key instanceof JsonWebKey))) {
      throw new InvalidKeySet()
    }

    const ids = keys.map(key => key.kid)

    if (ids.some(id => !id)) {
      throw new InvalidKeySet('One or more keys do not have an ID.')
    }

    if (new Set(ids).size !== ids.length) {
      throw new InvalidKeySet('The usage of the same ID for multiple keys in a JWKS is forbidden.')
    }

    this.keys = keys
  }

  public static load (keyset: any): JsonWebKeySet {
    try {
      return new JsonWebKeySet(keyset?.keys?.map((key: any) => new JsonWebKey(key)))
    } catch (error) {
      throw new InvalidKeySet(error.message)
    }
  }

  public getKey<KeyType> (keyId: string): JsonWebKey<KeyType> {
    return this.keys.find(key => key.kid === keyId)
  }
}
