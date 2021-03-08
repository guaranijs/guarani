import { InvalidKey } from '../../exceptions'
import { JsonWebKey } from '../../jwk'

export type SupportedHashes = 'sha256' | 'sha384' | 'sha512'

/**
 * Implementation of the Section 3 of RFC 7518.
 *
 * This class provides the expected method signatures
 * that will be used throughout the package.
 *
 * All JWS Algorithms **MUST** inherit from this class and
 * implement its methods.
 */
export abstract class JWSAlgorithm {
  public constructor (protected hash: SupportedHashes, protected algorithm: string) {}

  public abstract sign (data: Buffer, key: JsonWebKey): string
  public abstract verify (signature: string, data: Buffer, key: JsonWebKey): void
}

export function checkKey (key: JsonWebKey, alg: string, kty: string): void {
  if (!(key instanceof JsonWebKey)) throw new InvalidKey()

  if (key.alg && key.alg !== alg) {
    throw new InvalidKey(`This key is intended to be used by the algorithm "${key.alg}".`)
  }

  if (key.kty !== kty) {
    throw new InvalidKey(`This algorithm only accepts "${kty}" keys.`)
  }
}
