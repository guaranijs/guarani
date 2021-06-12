import { Objects } from '@guarani/utils'

import { InvalidJoseHeader } from '../exceptions'
import { JoseHeader, JoseHeaderParams } from '../jose.header'
import { JsonWebKeyParams } from '../jwk'
import {
  JWE_ALGORITHMS,
  JWE_ENCRYPTIONS,
  SupportedJWEAlgorithm,
  SupportedJWEEncryption
} from './algorithms'

/**
 * Defines the parameters supported by the JWE JOSE Header.
 */
export interface JWEHeaderParams extends JoseHeaderParams {
  /**
   * JWE CEK Algorithm used to encrypt and decrypt the Content Encryption Key.
   */
  readonly alg: SupportedJWEAlgorithm

  /**
   * JWE Authenticated Algorithm used to encrypt and decrypt the Plaintext.
   */
  readonly enc: SupportedJWEEncryption

  /**
   * Compression algorithm of the JSON Web Encryption.
   */
  readonly zip?: string

  /**
   * URI of a JWK Set that contains the key used to encrypt the token.
   */
  readonly jku?: string

  /**
   * JSON Web Key used to encrypt the token.
   */
  readonly jwk?: JsonWebKeyParams

  /**
   * ID of the key used to encrypt the token.
   */
  readonly kid?: string

  /**
   * URI of the X.509 certificate of the key used to encrypt the token.
   */
  readonly x5u?: string

  /**
   * Chain of X.509 certificates of the key used to encrypt the token.
   */
  readonly x5c?: string[]

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key used
   * to encrypt the token.
   */
  readonly x5t?: string

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key used
   * to encrypt the token.
   */
  readonly 'x5t#S256'?: string

  /**
   * Defines the type of the entire token.
   */
  readonly typ?: string

  /**
   * Defines the type of the payload.
   */
  readonly cty?: string

  /**
   * Defines the parameters that MUST be present in the header.
   */
  readonly crit?: string[]
}

export class JsonWebEncryptionHeader
  extends JoseHeader
  implements JWEHeaderParams {
  /**
   * JWE CEK Algorithm used to encrypt and decrypt the Content Encryption Key.
   */
  public readonly alg: SupportedJWEAlgorithm

  /**
   * JWE Authenticated Algorithm used to encrypt and decrypt the Plaintext.
   */
  public readonly enc: SupportedJWEEncryption

  /**
   * Compression algorithm of the JSON Web Encryption.
   */
  public readonly zip?: string

  /**
   * URI of a JWK Set that contains the key used to encrypt the token.
   */
  public readonly jku?: string

  /**
   * JSON Web Key used to encrypt the token.
   */
  public readonly jwk?: JsonWebKeyParams

  /**
   * ID of the key used to encrypt the token.
   */
  public readonly kid?: string

  /**
   * URI of the X.509 certificate of the key used to encrypt the token.
   */
  public readonly x5u?: string

  /**
   * Chain of X.509 certificates of the key used to encrypt the token.
   */
  public readonly x5c?: string[]

  /**
   * SHA-1 Thumbprint of the X.509 certificate of the key used
   * to encrypt the token.
   */
  public readonly x5t?: string

  /**
   * SHA-256 Thumbprint of the X.509 certificate of the key used
   * to encrypt the token.
   */
  public readonly 'x5t#S256'?: string

  /**
   * Defines the type of the entire token.
   */
  public readonly typ?: string

  /**
   * Defines the type of the payload.
   */
  public readonly cty?: string

  /**
   * Defines the parameters that MUST be present in the header.
   */
  public readonly crit?: string[]

  /**
   * Returns the provided JWE JOSE Header unmodified.
   *
   * @param header - Instance of a JsonWebEncryptionHeader
   */
  public constructor(header: JsonWebEncryptionHeader)

  /**
   * Instantiates a new JWE JOSE Header for JWE Compact Serialization.
   *
   * @param header - Parameters of the JWE JOSE Header.
   */
  public constructor(header: JWEHeaderParams)

  public constructor(header: JsonWebEncryptionHeader | JWEHeaderParams) {
    super()

    if (header instanceof JsonWebEncryptionHeader) {
      return header
    }

    if (!header.alg) {
      throw new InvalidJoseHeader('Missing required parameter "alg".')
    }

    if (!header.enc) {
      throw new InvalidJoseHeader('Missing required parameter "enc".')
    }

    this.checkHeader(header)

    Object.assign(this, Objects.removeNullishValues(header))
  }

  /**
   * Validates the parameters of the provided JWE JOSE Header.
   *
   * @param header - JWE JOSE Header to be validated.
   */
  protected checkHeader(header: Partial<JWEHeaderParams>): void {
    super.checkHeader(header)

    if (header.alg && !(header.alg in JWE_ALGORITHMS)) {
      throw new InvalidJoseHeader(
        'Invalid JSON Web Encryption Key Wrapping Algorithm.'
      )
    }

    if (header.enc && !(header.enc in JWE_ENCRYPTIONS)) {
      throw new InvalidJoseHeader(
        'Invalid JSON Web Encryption Content Encryption Algorithm.'
      )
    }

    if (header.zip && typeof header.zip !== 'string') {
      throw new InvalidJoseHeader('Invalid parameter "zip".')
    }
  }
}
