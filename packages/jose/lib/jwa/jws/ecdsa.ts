import { sign, verify } from 'crypto'

import { Base64Url } from '@guarani/utils'

import { InvalidKey, InvalidSignature } from '../../exceptions'
import { JsonWebKey } from '../../jwk'
import { EC } from '../jwk'
import { checkKey as baseCheckKey, JWSAlgorithm, SupportedHashes } from './algorithm'

function checkKey (key: JsonWebKey, alg: string, kty: string, curve: EC.SupportedCurves): void {
  baseCheckKey(key, alg, kty)

  // @ts-expect-error
  if (key.crv !== curve) {
    throw new InvalidKey(`This algorithm only accepts the curve "${curve}".`)
  }
}

class Algorithm extends JWSAlgorithm {
  private keyType = 'EC'

  public constructor (
    protected hash: SupportedHashes,
    protected algorithm: string,
    protected curve: EC.SupportedCurves
  ) { super(hash, algorithm) }

  public sign (data: Buffer, key: JsonWebKey<EC.PrivateParams>): string {
    checkKey(key, this.algorithm, this.keyType, this.curve)
    return Base64Url.encode(sign(this.hash, data, key.privateKey))
  }

  public verify (signature: string, data: Buffer, key: JsonWebKey<EC.PublicParams>): void {
    checkKey(key, this.algorithm, this.keyType, this.curve)

    if (!verify(this.hash, data, key.publicKey, Base64Url.decode(signature))) {
      throw new InvalidSignature()
    }
  }
}

export function ES256 (): Algorithm {
  return new Algorithm('sha256', 'ES256', 'P-256')
}

export function ES384 (): Algorithm {
  return new Algorithm('sha384', 'ES384', 'P-384')
}

export function ES512 (): Algorithm {
  return new Algorithm('sha512', 'ES512', 'P-521')
}
