import { Dict } from '@guarani/utils'

import { JsonWebKey } from '../../../jwk'
import { WrappedKey } from '../../_types'
import { JWEEncryption } from '../enc'

/**
 * Implementation of the Section 4 of RFC 7518.
 *
 * This class provides the expected **Key Wrapping Algorithms**
 * that will be used throughout the package.
 *
 * All JWE Algorithms **MUST** inherit from this class and
 * implement its methods.
 */
export abstract class JWEAlgorithm {
  /**
   * Instantiates a new JWE Algorithm to wrap and unwrap Content Encryption Keys.
   *
   * @param algorithm - Name of the algorithm.
   */
  public constructor(protected readonly algorithm: string) {}

  /**
   * Generates a new CEK based on the provided JWE Content Encryption Algorithm
   * and wraps it using the provided JSON Web Key.
   *
   * @param enc - JWE Content Encryption of the JSON Web Encryption Token.
   * @param key - JWK used to wrap the generated CEK.
   * @returns CEK generated, Encrypted CEK and optional additional headers.
   */
  public abstract wrap(enc: JWEEncryption, key: JsonWebKey): Promise<WrappedKey>

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param enc - JWE Content Encryption of the JSON Web Encryption Token.
   * @param ek - Encrypted CEK of the JSON Web Encryption Token.
   * @param key - JSON Web Key used to unwrap the Encrypted CEK.
   * @param header - Optional JWE JOSE Header containing the additional headers.
   * @throws {InvalidJsonWebEncryption} Could not unwrap the Encrypted CEK.
   * @returns Unwrapped Content Encryption Key.
   */
  public abstract unwrap(
    enc: JWEEncryption,
    ek: Buffer,
    key: JsonWebKey,
    header?: Dict<any>
  ): Promise<Buffer>
}
