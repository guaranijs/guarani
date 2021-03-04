import { createSecretKey, KeyObject, randomBytes } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidKey } from '../../exceptions'
import { JWKAlgorithm, JWKParams } from './algorithm'

export interface OCTSecretParams extends JWKParams {
  k: string
}

export class OCTSecretKey extends JWKAlgorithm implements OCTSecretParams {
  public kty: 'oct'
  public k: string

  public constructor (data: OCTSecretParams) {
    super(data)

    if (data.kty !== 'oct') {
      throw new InvalidKey(`Invalid parameter "kty". Expected "oct", got "${data.kty}".`)
    }

    if (!data.k || typeof data.k !== 'string') throw new InvalidKey('Invalid parameter "k".')

    this.k = data.k
  }

  public get secretKey (): KeyObject {
    return createSecretKey(Base64Url.decode(this.k))
  }

  public export (): string {
    return Base64Url.decode(this.k).toString('base64')
  }
}

export function createOctKey (size: number = 32): OCTSecretKey {
  if (typeof size !== 'number' || !Number.isInteger(size)) {
    throw new InvalidKey('The key size MUST be a valid integer.')
  }

  if (size < 32) throw new InvalidKey('The key size MUST be AT LEAST 32 bytes.')

  const secret = Base64Url.encode(randomBytes(size))
  return new OCTSecretKey({ kty: 'oct', k: secret })
}

export function parseOctKey (data: string | Buffer): OCTSecretKey {
  if (typeof data !== 'string' || !Buffer.isBuffer(data)) {
    throw new InvalidKey('The secret MUST be either a Base64Url string or a Buffer.')
  }

  const secret = (typeof data === 'string') ? data : Base64Url.encode(data)
  return new OCTSecretKey({ kty: 'oct', k: secret })
}
