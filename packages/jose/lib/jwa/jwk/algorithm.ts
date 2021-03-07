import { KeyObject } from 'crypto'
import { InvalidKey, JoseError } from '../../exceptions'

export interface JWKAParams {
  kty?: string
}

export abstract class JWKAlgorithm {
  public abstract kty: string

  public constructor (data: JWKAParams) {
    if (!data) throw new InvalidKey()
    if (typeof data !== 'object' || Array.isArray(data)) throw new InvalidKey()
    if (!data.kty || typeof data.kty !== 'string') throw new InvalidKey('Invalid parameter "kty".')
  }

  public get secretKey (): KeyObject {
    throw new JoseError('No secret key found.')
  }

  public get publicKey (): KeyObject {
    throw new JoseError('No public key found.')
  }

  public get privateKey (): KeyObject {
    throw new JoseError('No private key found.')
  }

  public abstract export (): string
}
