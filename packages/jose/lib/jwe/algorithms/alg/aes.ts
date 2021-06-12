import { Base64Url } from '@guarani/utils'

import { OctKey } from '../../../jwk'
import { unwrap, wrap } from '../../utils/aeskw'
import { WrappedKey } from '../../_types'
import { JWEEncryption } from '../enc'
import { JWEAlgorithm } from './jwe-algorithm'

class AESAlgorithm extends JWEAlgorithm {
  private readonly KEY_SIZE: number

  public constructor(protected readonly algorithm: string) {
    super(algorithm)

    this.KEY_SIZE = parseInt(this.algorithm.substr(1, 3))
  }

  public async wrap(enc: JWEEncryption, key: OctKey): Promise<WrappedKey> {
    const secretKey = key.export('binary')
    const cek = enc.generateCEK()
    const ek = wrap(this.KEY_SIZE, cek, secretKey)

    return { cek, ek: Base64Url.encode(ek) }
  }

  public async unwrap(
    enc: JWEEncryption,
    ek: Buffer,
    key: OctKey
  ): Promise<Buffer> {
    const secretKey = key.export('binary')
    const cek = unwrap(this.KEY_SIZE, ek, secretKey)

    enc.checkKey(cek)

    return cek
  }
}

export const A128KW = new AESAlgorithm('A128KW')

export const A192KW = new AESAlgorithm('A192KW')

export const A256KW = new AESAlgorithm('A256KW')
