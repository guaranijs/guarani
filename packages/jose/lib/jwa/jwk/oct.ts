import { createSecretKey, KeyObject, randomBytes } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidKey } from '../../exceptions'
import { JWKAlgorithm, JWKAParams } from './algorithm'

export namespace OCT {
  export interface SecretParams extends JWKAParams {
    k: string
  }

  class SecretKey extends JWKAlgorithm implements SecretParams {
    public kty: 'oct'
    public k: string

    public constructor (data: SecretParams) {
      super(data)

      if (data.kty !== 'oct') {
        throw new InvalidKey(`Invalid parameter "kty". Expected "oct", got "${data.kty}".`)
      }

      if (!data.k || typeof data.k !== 'string') {
        throw new InvalidKey('Invalid parameter "k".')
      }

      if (Base64Url.decode(data.k).length < 32) {
        throw new InvalidKey('The key size MUST be AT LEAST 32 bytes.')
      }

      this.k = data.k
    }

    public get secretKey (): KeyObject {
      return createSecretKey(Base64Url.decode(this.k))
    }

    public export (): string {
      return Base64Url.decode(this.k).toString('base64')
    }
  }

  export function create (size: number): SecretKey {
    if (typeof size !== 'number' || !Number.isInteger(size)) {
      throw new InvalidKey('The key size MUST be a valid integer.')
    }

    if (size < 32) {
      throw new InvalidKey('The key size MUST be AT LEAST 32 bytes.')
    }

    const secret = Base64Url.encode(randomBytes(size))

    return new SecretKey({ kty: 'oct', k: secret })
  }

  export function load (data: SecretParams): SecretKey {
    return new SecretKey(data)
  }

  export function parse (data: string | Buffer): SecretKey {
    if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
      throw new InvalidKey('The secret MUST be either a Base64 string or a Buffer.')
    }

    const secret = (typeof data === 'string') ? Base64Url.fromBase64(data) : Base64Url.encode(data)
    return new SecretKey({ kty: 'oct', k: secret })
  }
}
