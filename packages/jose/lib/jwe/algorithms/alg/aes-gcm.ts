import { Base64Url } from '@guarani/utils'

import {
  CipherGCMTypes,
  createCipheriv,
  createDecipheriv,
  createSecretKey,
  randomBytes
} from 'crypto'

import { InvalidJsonWebEncryption, JoseError } from '../../../exceptions'
import { OctKey } from '../../../jwk'
import { WrappedKey } from '../../_types'
import { JWEEncryption } from '../enc'
import { JWEAlgorithm } from './jwe-algorithm'
import { AESGMCWrappedKey } from './_types'

/**
 * Implementation of the AES Galois/Counter Mode Key Wrapping Algorithm.
 */
class AESGCMAlgorithm extends JWEAlgorithm {
  /**
   * Size of the Initialization Vector in bits.
   */
  private readonly IV_SIZE: number = 96

  /**
   * Size of the Authentication Tag in bytes.
   */
  private readonly TAG_LENGTH: number = 16

  /**
   * Size of the Content Encryption Key in bits.
   */
  private readonly KEY_SIZE: number

  /**
   * Instantiates a new AES Galois/Counter Mode Algorithm
   * to wrap and unwrap a Content Encryption Key.
   *
   * @param algorithm - Name of the algorithm.
   */
  public constructor(protected readonly algorithm: string) {
    super(algorithm)

    this.KEY_SIZE = parseInt(this.algorithm.substr(1, 3))
  }

  /**
   * Generates a new CEK based on the provided JWE Content Encryption Algorithm
   * and wraps it using the provided JSON Web Key.
   *
   * @param enc - JWE Content Encryption of the JSON Web Encryption Token.
   * @param key - JWK used to wrap the generated CEK.
   * @returns CEK generated, Encrypted CEK and additional headers.
   */
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

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc - JWE Content Encryption of the JSON Web Encryption Token.
   * @param ek - Encrypted CEK of the JSON Web Encryption Token.
   * @param key - JSON Web Key used to unwrap the Encrypted CEK.
   * @param header - JWE JOSE Header containing the additional headers.
   * @throws {InvalidJsonWebEncryption} Could not unwrap the Encrypted CEK.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(
    enc: JWEEncryption,
    ek: Buffer,
    key: OctKey,
    header: AESGMCWrappedKey
  ): Promise<Buffer> {
    try {
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
    } catch (error) {
      if (error instanceof JoseError) {
        throw new InvalidJsonWebEncryption(error.message)
      }

      throw new InvalidJsonWebEncryption()
    }
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

/**
 * Key wrapping with AES Galois/Counter Mode using 128-bit key.
 */
export const A128GCMKW = new AESGCMAlgorithm('A128GCMKW')

/**
 * Key wrapping with AES Galois/Counter Mode using 192-bit key.
 */
export const A192GCMKW = new AESGCMAlgorithm('A192GCMKW')

/**
 * Key wrapping with AES Galois/Counter Mode using 256-bit key.
 */
export const A256GCMKW = new AESGCMAlgorithm('A256GCMKW')
