import { InvalidJsonWebEncryption, JoseError } from '../../../exceptions'
import { OctKey } from '../../../jwk'
import { WrappedKey } from '../../_types'
import { JWEAlgorithm } from './jwe-algorithm'

/**
 * Implementation of the `No Key Wrapping` Algorithm.
 */
class DIRAlgorithm extends JWEAlgorithm {
  /**
   * Uses the provided JSON Web Key as the Content Encryption Key.
   *
   * @param cek - Content Encryption Key used to encrypt the Plaintext.
   * @param key - JWK used as Content Encryption Key.
   * @returns WrapKey as the CEK and an empty string as the EK.
   */
  public async wrap(cek: Buffer, key: OctKey): Promise<WrappedKey> {
    return { ek: '' }
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param ek - ~Ignored Parameter~.
   * @param key - JSON Web Key used as the Content Encryption Key.
   * @throws {InvalidJsonWebEncryption} Could not unwrap the Encrypted CEK.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(ek: Buffer, key: OctKey): Promise<Buffer> {
    try {
      return key.export('binary')
    } catch (error) {
      if (error instanceof JoseError) {
        throw new InvalidJsonWebEncryption(error.message)
      }

      throw new InvalidJsonWebEncryption()
    }
  }
}

/**
 * Direct Encryption with a Shared Symmetric Key.
 */
export const dir = new DIRAlgorithm('dir')
