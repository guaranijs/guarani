import { Base64Url } from '@guarani/utils'

import { createCipheriv, createDecipheriv, CipherGCMTypes } from 'crypto'

import { InvalidJsonWebEncryption } from '../../../exceptions'
import { AuthenticatedEncryption } from '../../_types'
import { JWEEncryption } from './jwe-encryption'

class AESGCMEncryption extends JWEEncryption {
  public readonly CEK_SIZE: number

  public readonly IV_SIZE: number = 96

  private readonly TAG_LENGTH: number = 16

  public constructor(protected readonly algorithm: string) {
    super(algorithm)

    this.CEK_SIZE = parseInt(this.algorithm.substr(1, 3))
  }

  public encrypt(
    plaintext: Buffer,
    aad: Buffer,
    iv: Buffer,
    key: Buffer
  ): AuthenticatedEncryption {
    this.checkIV(iv)
    this.checkKey(key)

    const algorithm = <CipherGCMTypes>`aes-${this.CEK_SIZE}-gcm`
    const cipher = createCipheriv(algorithm, key, iv, {
      authTagLength: this.TAG_LENGTH
    })

    cipher.setAAD(aad)

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const tag = cipher.getAuthTag()

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
      const algorithm = <CipherGCMTypes>`aes-${this.CEK_SIZE}-gcm`
      const decipher = createDecipheriv(algorithm, key, iv, {
        authTagLength: this.TAG_LENGTH
      })

      decipher.setAAD(aad)
      decipher.setAuthTag(tag)

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
      ])

      return decrypted
    } catch (error) {
      throw new InvalidJsonWebEncryption()
    }
  }
}

export const A128GCM = new AESGCMEncryption('A128GCM')

export const A192GCM = new AESGCMEncryption('A192GCM')

export const A256GCM = new AESGCMEncryption('A256GCM')
