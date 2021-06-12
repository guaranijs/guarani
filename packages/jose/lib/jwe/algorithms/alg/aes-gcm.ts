import { Base64Url } from '@guarani/utils'

import {
  CipherGCMTypes,
  createCipheriv,
  createDecipheriv,
  createSecretKey,
  randomBytes
} from 'crypto'

import { OctKey } from '../../../jwk'
import { WrappedKey } from '../../_types'
import { JWEEncryption } from '../enc'
import { JWEAlgorithm } from './jwe-algorithm'
import { AESGMCWrappedKey } from './_types'

class AESGCMAlgorithm extends JWEAlgorithm {
  private readonly IV_SIZE: number = 96

  private readonly TAG_LENGTH: number = 16

  private readonly KEY_SIZE: number

  public constructor(protected readonly algorithm: string) {
    super(algorithm)

    this.KEY_SIZE = parseInt(this.algorithm.substr(1, 3))
  }

  public async wrap(
    enc: JWEEncryption,
    key: OctKey
  ): Promise<WrappedKey<AESGMCWrappedKey>> {
    const cek = enc.generateCEK()
    const secretKey = createSecretKey(key.export('binary'))

    const iv = this.generateIV()

    const algorithm = <CipherGCMTypes>`aes-${this.KEY_SIZE}-gcm`
    const cipher = createCipheriv(algorithm, secretKey, iv, {
      authTagLength: this.TAG_LENGTH
    })

    cipher.setAAD(Buffer.alloc(0))

    const ek = Buffer.concat([cipher.update(cek), cipher.final()])
    const tag = cipher.getAuthTag()

    return {
      cek,
      ek: Base64Url.encode(ek),
      header: { iv: Base64Url.encode(iv), tag: Base64Url.encode(tag) }
    }
  }

  public async unwrap(
    enc: JWEEncryption,
    ek: Buffer,
    key: OctKey,
    header: AESGMCWrappedKey
  ): Promise<Buffer> {
    const secretKey = createSecretKey(key.export('binary'))
    const tag = Base64Url.decode(header.tag)
    const iv = Base64Url.decode(header.iv)

    const algorithm = <CipherGCMTypes>`aes-${this.KEY_SIZE}-gcm`
    const decipher = createDecipheriv(algorithm, secretKey, iv, {
      authTagLength: this.TAG_LENGTH
    })

    decipher.setAAD(Buffer.alloc(0))
    decipher.setAuthTag(tag)

    const cek = Buffer.concat([decipher.update(ek), decipher.final()])

    enc.checkKey(cek)

    return cek
  }

  /**
   * Generates a new Initialization Vector.
   *
   * @returns Generated Initialization Vector.
   */
  private generateIV(): Buffer {
    return randomBytes(Math.floor(this.IV_SIZE / 8))
  }
}

export const A128GCMKW = new AESGCMAlgorithm('A128GCMKW')

export const A192GCMKW = new AESGCMAlgorithm('A192GCMKW')

export const A256GCMKW = new AESGCMAlgorithm('A256GCMKW')
