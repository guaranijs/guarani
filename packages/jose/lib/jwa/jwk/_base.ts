import { InvalidKey } from '../../exceptions'

export interface JWKParams {
  kty: string
}

export abstract class JWKAlgorithm {
  public abstract kty: string

  public constructor (data: JWKParams) {
    if (!data) throw new InvalidKey()
    if (typeof data !== 'object' || Array.isArray(data)) throw new InvalidKey()
    if (!data.kty || typeof data.kty !== 'string') throw new InvalidKey('Invalid parameter "kty".')
  }

  public abstract export (): string
}
