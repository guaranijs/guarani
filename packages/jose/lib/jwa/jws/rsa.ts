import { sign, verify, constants } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidSignature } from '../../exceptions'
import { JsonWebKey } from '../../jwk'
import { RSA } from '../jwk'
import { checkKey, JWSAlgorithm, SupportedHashes } from './algorithm'

class Algorithm extends JWSAlgorithm {
  private keyType = 'RSA'

  public constructor (
    protected hash: SupportedHashes,
    protected algorithm: string,
    private padding: number
  ) {
    super(hash, algorithm)
  }

  public sign (data: Buffer, key: JsonWebKey<RSA.PrivateParams>): string {
    checkKey(key, this.algorithm, this.keyType)
    return Base64Url.encode(sign(this.hash, data, { key: key.privateKey, padding: this.padding }))
  }

  public verify (signature: string, data: Buffer, key: JsonWebKey<RSA.PublicParams>): void {
    checkKey(key, this.algorithm, this.keyType)

    const verified = verify(
      this.hash,
      data,
      { key: key.publicKey, padding: this.padding },
      Base64Url.decode(signature)
    )

    if (!verified) throw new InvalidSignature()
  }
}

export function RS256 (): Algorithm {
  return new Algorithm('sha256', 'RS256', constants.RSA_PKCS1_PADDING)
}

export function RS384 (): Algorithm {
  return new Algorithm('sha384', 'RS384', constants.RSA_PKCS1_PADDING)
}

export function RS512 (): Algorithm {
  return new Algorithm('sha512', 'RS512', constants.RSA_PKCS1_PADDING)
}

export function PS256 (): Algorithm {
  return new Algorithm('sha256', 'PS256', constants.RSA_PKCS1_PSS_PADDING)
}

export function PS384 (): Algorithm {
  return new Algorithm('sha384', 'PS384', constants.RSA_PKCS1_PSS_PADDING)
}

export function PS512 (): Algorithm {
  return new Algorithm('sha512', 'PS512', constants.RSA_PKCS1_PSS_PADDING)
}
