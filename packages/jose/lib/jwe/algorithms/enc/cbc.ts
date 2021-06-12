import { Base64Url } from '@guarani/utils'

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  timingSafeEqual
} from 'crypto'

import { InvalidJsonWebEncryption } from '../../../exceptions'
import { SupportedHash } from '../../../types'
import { AuthenticatedEncryption } from '../../_types'
import { JWEEncryption } from './jwe-encryption'

class CBCHS2Encryption extends JWEEncryption {
  public readonly CEK_SIZE: number

  public readonly IV_SIZE: number = 128

  private readonly KEY_SIZE: number

  private readonly HASH: SupportedHash

  private readonly TAG_LENGTH: number = 16

  public constructor(protected readonly algorithm: string) {
    super(algorithm)

    const regex = this.algorithm.match(/A([0-9]{3})CBC-HS([0-9]{3})/)

    this.KEY_SIZE = parseInt(regex[1])
    this.HASH = <SupportedHash>`SHA${regex[2]}`
    this.CEK_SIZE = this.KEY_SIZE * 2
  }

  public encrypt(
    plaintext: Buffer,
    aad: Buffer,
    iv: Buffer,
    key: Buffer
  ): AuthenticatedEncryption {
    this.checkIV(iv)
    this.checkKey(key)

    const macKey = key.subarray(0, this.KEY_SIZE >> 3)
    const encKey = key.subarray(this.KEY_SIZE >> 3)

    const cipher = createCipheriv(`aes-${this.KEY_SIZE}-cbc`, encKey, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])

    const tag = this.getAuthTag(ciphertext, iv, aad, macKey)

    return {
      ciphertext: Base64Url.encode(ciphertext),
      tag: Base64Url.encode(tag)
    }
  }

  public decrypt(
    ciphertext: Buffer,
    aad: Buffer,
    iv: Buffer,
    tag: Buffer,
    key: Buffer
  ): Buffer {
    this.checkIV(iv)
    this.checkKey(key)

    try {
      const macKey = key.subarray(0, this.KEY_SIZE >> 3)
      const encKey = key.subarray(this.KEY_SIZE >> 3)

      const expectedTag = this.getAuthTag(ciphertext, iv, aad, macKey)

      if (!timingSafeEqual(tag, expectedTag)) {
        throw new InvalidJsonWebEncryption()
      }

      const decipher = createDecipheriv(`aes-${this.KEY_SIZE}-cbc`, encKey, iv)

      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ])

      return plaintext
    } catch {
      throw new InvalidJsonWebEncryption()
    }
  }

  private getAuthTag(
    ciphertext: Buffer,
    iv: Buffer,
    aad: Buffer,
    key: Buffer
  ): Buffer {
    const len = aad.length << 3
    const buf = Buffer.alloc(8)

    buf.writeUInt32BE(Math.floor(len / 2 ** 32), 0)
    buf.writeUInt32BE(len % 2 ** 32, 4)

    const data = Buffer.concat([aad, iv, ciphertext, buf])

    return createHmac(this.HASH, key)
      .update(data)
      .digest()
      .slice(0, this.KEY_SIZE >> 3)
  }
}

export const A128CBC_HS256 = new CBCHS2Encryption('A128CBC-HS256')

export const A192CBC_HS384 = new CBCHS2Encryption('A192CBC-HS384')

export const A256CBC_HS512 = new CBCHS2Encryption('A256CBC-HS512')
