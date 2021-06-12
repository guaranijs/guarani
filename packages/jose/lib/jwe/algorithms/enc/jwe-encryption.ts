import { randomBytes } from 'crypto'

import { InvalidJsonWebEncryption } from '../../../exceptions'
import { AuthenticatedEncryption } from '../../_types'

export abstract class JWEEncryption {
  /**
   * Size of the Content Encryption Key in bits.
   */
  public abstract readonly CEK_SIZE: number

  /**
   * Size of the Initialization Vector in bits.
   */
  public abstract readonly IV_SIZE: number

  public constructor(protected readonly algorithm: string) {}

  /**
   * Generates a new Content Encryption Key.
   * @returns Generated Content Encryption Key.
   */
  public generateCEK(): Buffer {
    return randomBytes(Math.floor(this.CEK_SIZE / 8))
  }

  /**
   * Generates a new Initialization Vector.
   *
   * @returns Generated Initialization Vector.
   */
  public generateIV(): Buffer {
    return randomBytes(Math.floor(this.IV_SIZE / 8))
  }

  /**
   * Validates if the provided Initialization Vector is valid to the algorithm.
   *
   * @param iv - Initialization Vector to be validated.
   */
  protected checkIV(iv: Buffer): void {
    if (iv.length * 8 !== this.IV_SIZE) {
      throw new InvalidJsonWebEncryption()
    }
  }

  /**
   * Checks if a key can be used by the requesting algorithm.
   *
   * @param key - Key to be checked.
   * @throws {InvalidJsonWebEncryption} The provided key is invalid.
   */
  public checkKey(key: Buffer): void {
    if (!Buffer.isBuffer(key) || key.length * 8 !== this.CEK_SIZE) {
      throw new InvalidJsonWebEncryption('Invalid key.')
    }
  }

  public abstract encrypt(
    plaintext: Buffer,
    aad: Buffer,
    iv: Buffer,
    key: Buffer
  ): AuthenticatedEncryption

  public abstract decrypt(
    ciphertext: Buffer,
    aad: Buffer,
    iv: Buffer,
    tag: Buffer,
    key: Buffer
  ): Buffer
}
