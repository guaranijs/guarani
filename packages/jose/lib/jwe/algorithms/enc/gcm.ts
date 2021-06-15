import { Base64Url } from '@guarani/utils'

import { createCipheriv, createDecipheriv, CipherGCMTypes } from 'crypto'

import { InvalidJsonWebEncryption } from '../../../exceptions'
import { AuthenticatedEncryption } from '../../_types'
import { JWEEncryption } from './jwe-encryption'

/**
 * Implementation of the AES Galois/Counter Mode Content Encryption Algorithm.
 */
class AESGCMEncryption extends JWEEncryption {
  /**
   * Size of the Content Encryption Key in bits.
   */
  public readonly CEK_SIZE: number

  /**
   * Size of the Initialization Vector in bits.
   */
  public readonly IV_SIZE: number = 96

  /**
   * Size of the Authentication Tag in bytes.
   */
  private readonly TAG_LENGTH: number = 16

  /**
   * Instantiates a new AES Galois/Counter Mode Encryption
   * to encrypt and decrypt a Plaintext.
   *
   * @param algorithm - Name of the algorithm.
   */
  public constructor(protected readonly algorithm: string) {
    super(algorithm)

    this.CEK_SIZE = parseInt(this.algorithm.substr(1, 3))
  }

  /**
   * Encrypts the provided plaintext.
   *
   * @param plaintext - Plaintext to be encrypted.
   * @param aad - Additional Authenticated Data.
   * @param iv - Initialization Vector.
   * @param key - Content Encryption Key used to encrypt the plaintext.
   * @returns Resulting Ciphertext and Authentication Tag.
   */
  public async encrypt(
    plaintext: Buffer,
    aad: Buffer,
    iv: Buffer,
    key: Buffer
  ): Promise<AuthenticatedEncryption> {
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

  /**
   * Decrypts the provided ciphertext back to its original Buffer representaion.
   *
   * @param ciphertext - Ciphertext to be decrypted.
   * @param aad - Additional Authenticated Data.
   * @param iv - Initialization Vector.
   * @param tag - Authentication Tag.
   * @param key - Content Encryption Key used to decrypt the plaintext.
   * @throws {InvalidJsonWebEncryption} Could not decrypt the ciphertext.
   * @returns Buffer representation of the decrypted plaintext.
   */
  public async decrypt(
    ciphertext: Buffer,
    aad: Buffer,
    iv: Buffer,
    tag: Buffer,
    key: Buffer
  ): Promise<Buffer> {
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

/**
 * AES GCM using 128-bit key.
 */
export const A128GCM = new AESGCMEncryption('A128GCM')

/**
 * AES GCM using 192-bit key.
 */
export const A192GCM = new AESGCMEncryption('A192GCM')

/**
 * AES GCM using 256-bit key.
 */
export const A256GCM = new AESGCMEncryption('A256GCM')
