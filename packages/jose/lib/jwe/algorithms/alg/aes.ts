import b64Url from '@guarani/base64url'

import {
  InvalidJsonWebEncryption,
  InvalidKey,
  JoseError
} from '../../../exceptions'
import { OctKey } from '../../../jwk'
import { unwrap, wrap } from '../../utils/aeskw'
import { WrappedKey } from '../../_types'
import { JWEAlgorithm } from './jwe-algorithm'

/**
 * Implementation of the AES Key Wrapping Algorithm.
 */
class AESAlgorithm extends JWEAlgorithm {
  /**
   * Size of the Content Encryption Key in bits.
   */
  private readonly KEY_SIZE: number

  /**
   * Instantiates a new AES Algorithm to wrap and unwrap a Content Encryption Key.
   *
   * @param algorithm Name of the algorithm.
   */
  public constructor(protected readonly algorithm: string) {
    super(algorithm)

    this.KEY_SIZE = parseInt(this.algorithm.substr(1, 3))
  }

  /**
   * Generates a new CEK based on the provided JWE Content Encryption Algorithm
   * and wraps it using the provided JSON Web Key.
   *
   * @param cek Content Encryption Key used to encrypt the Plaintext.
   * @param key JWK used to wrap the generated CEK.
   * @returns CEK generated and Encrypted CEK.
   */
  public async wrap(cek: Buffer, key?: OctKey): Promise<WrappedKey> {
    if (key == null) {
      throw new InvalidKey('Missing required wrap key.')
    }

    const exportedKey = key.export('binary')

    if (exportedKey.length * 8 !== this.KEY_SIZE) {
      throw new JoseError('Invalid key size.')
    }

    return { ek: b64Url.encode(wrap(cek, key)) }
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc JWE Content Encryption of the JSON Web Encryption Token.
   * @param ek Encrypted CEK of the JSON Web Encryption Token.
   * @param key JSON Web Key used to unwrap the Encrypted CEK.
   * @throws {InvalidJsonWebEncryption} Could not unwrap the Encrypted CEK.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(ek: Buffer, key: OctKey): Promise<Buffer> {
    try {
      const exportedKey = key.export('binary')

      if (exportedKey.length * 8 !== this.KEY_SIZE) {
        throw new JoseError('Invalid key size.')
      }

      return unwrap(ek, key)
    } catch (error) {
      if (error instanceof JoseError) {
        throw new InvalidJsonWebEncryption(error.message)
      }

      throw new InvalidJsonWebEncryption()
    }
  }
}

/**
 * Key wrapping with AES using 128-bit key.
 */
export const A128KW = new AESAlgorithm('A128KW')

/**
 * Key wrapping with AES using 192-bit key.
 */
export const A192KW = new AESAlgorithm('A192KW')

/**
 * Key wrapping with AES using 256-bit key.
 */
export const A256KW = new AESAlgorithm('A256KW')
