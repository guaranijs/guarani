import { createHmac } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidSignature } from '../../exceptions'
import { JsonWebKey } from '../../jwk'
import { checkKey, JWSAlgorithm } from './algorithm'

class Algorithm extends JWSAlgorithm {
  private keyType = 'oct'

  public sign (data: Buffer, key: JsonWebKey): string {
    checkKey(key, this.algorithm, this.keyType)

    const signature = createHmac(this.hash, key.secretKey)
    signature.update(data)
    return Base64Url.encode(signature.digest())
  }

  public verify (signature: string, data: Buffer, key: JsonWebKey): void {
    checkKey(key, this.algorithm, this.keyType)

    if (this.sign(data, key) !== signature) throw new InvalidSignature()
  }
}

export function HS256 (): Algorithm {
  return new Algorithm('sha256', 'HS256')
}

export function HS384 (): Algorithm {
  return new Algorithm('sha384', 'HS384')
}

export function HS512 (): Algorithm {
  return new Algorithm('sha512', 'HS512')
}
