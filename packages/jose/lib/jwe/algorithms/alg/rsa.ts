import b64Url from '@guarani/base64url'
import { Optional } from '@guarani/types'

import {
  createPrivateKey,
  createPublicKey,
  privateDecrypt,
  publicEncrypt
} from 'crypto'

import {
  InvalidJsonWebEncryption,
  InvalidKey,
  JoseError
} from '../../../exceptions'
import { RsaKey, RsaPadding } from '../../../jwk'
import { SupportedHash } from '../../../types'
import { WrappedKey } from '../../_types'
import { JWEAlgorithm } from './jwe-algorithm'

/**
 * Implementation of the RSA Key Wrapping Algorithm.
 */
class RSAAlgorithm extends JWEAlgorithm {
  /**
   * Instantiates a new RSA Key Wrapping Algorithm
   * to wrap and unwrap a Content Encryption Key.
   *
   * @param algorithm Name of the algorithm.
   * @param padding Padding to be used by the algorithm.
   * @param hash Hash algorithm used to wrap and unwrap a CEK.
   */
  public constructor(
    protected readonly algorithm: string,
    protected readonly padding: RsaPadding,
    protected readonly hash?: Optional<SupportedHash>
  ) {
    super(algorithm)
  }

  /**
   * Generates a new CEK based on the provided JWE Content Encryption Algorithm
   * and wraps it using the provided JSON Web Key.
   *
   * @param cek Content Encryption Key used to encrypt the Plaintext.
   * @param key JWK used to wrap the generated CEK.
   * @returns CEK generated and Encrypted CEK.
   */
  public async wrap(cek: Buffer, key?: Optional<RsaKey>): Promise<WrappedKey> {
    if (key == null) {
      throw new InvalidKey('Missing required wrap key.')
    }

    const publicKey = createPublicKey(key.export('public', 'pem', 'pkcs1'))
    const ek = publicEncrypt(
      { key: publicKey, oaepHash: this.hash, padding: this.padding },
      cek
    )

    return { ek: b64Url.encode(ek) }
  }

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param ek Encrypted CEK of the JSON Web Encryption Token.
   * @param key JSON Web Key used to unwrap the Encrypted CEK.
   * @throws {InvalidJsonWebEncryption} Could not unwrap the Encrypted CEK.
   * @returns Unwrapped Content Encryption Key.
   */
  public async unwrap(ek: Buffer, key: RsaKey): Promise<Buffer> {
    try {
      const privateKey = createPrivateKey(key.export('private', 'pem', 'pkcs1'))
      const cek = privateDecrypt(
        { key: privateKey, oaepHash: this.hash, padding: this.padding },
        ek
      )

      return cek
    } catch (error) {
      if (error instanceof JoseError) {
        throw new InvalidJsonWebEncryption(error.message)
      }

      throw new InvalidJsonWebEncryption()
    }
  }
}

/**
 * RSAES-PKCS1-v1_5.
 */
export const RSA1_5 = new RSAAlgorithm('RSA1_5', RsaPadding.PKCS1)

/**
 * RSAES OAEP using default parameters.
 */
export const RSA_OAEP = new RSAAlgorithm('RSA-OAEP', RsaPadding.OAEP, 'SHA1')

/**
 * RSAES OAEP using SHA256 and MGF1 with SHA256.
 */
export const RSA_OAEP_256 = new RSAAlgorithm(
  'RSA-OAEP-256',
  RsaPadding.OAEP,
  'SHA256'
)

/**
 * RSAES OAEP using SHA384 and MGF1 with SHA384.
 */
export const RSA_OAEP_384 = new RSAAlgorithm(
  'RSA-OAEP-384',
  RsaPadding.OAEP,
  'SHA384'
)

/**
 * RSAES OAEP using SHA512 and MGF1 with SHA512.
 */
export const RSA_OAEP_512 = new RSAAlgorithm(
  'RSA-OAEP-512',
  RsaPadding.OAEP,
  'SHA512'
)
