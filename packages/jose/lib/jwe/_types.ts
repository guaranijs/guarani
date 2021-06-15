import { Dict } from '@guarani/utils'

/**
 * Interface of the Content Encryption result.
 */
export interface AuthenticatedEncryption {
  /**
   * Base64Url representation of the generated ciphertext.
   */
  readonly ciphertext: string

  /**
   * Base64Url representation of the Authentication Tag.
   */
  readonly tag: string
}

/**
 * Interface of the Key Wrapping result.
 */
export interface WrappedKey<AdditionalJoseHeaderParams = Dict<any>> {
  /**
   * Generated Content Encryption Key.
   */
  readonly cek: Buffer

  /**
   * Encrypted CEK.
   */
  readonly ek: string

  /**
   * Additional JWE JOSE Header parameters.
   */
  readonly header?: AdditionalJoseHeaderParams
}
