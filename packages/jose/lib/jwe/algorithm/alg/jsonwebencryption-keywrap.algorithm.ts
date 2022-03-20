import { Dict, Optional } from '@guarani/types';

import { JsonWebKey } from '../../../jwk/jsonwebkey';
import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from '../../supported-jsonwebencryption-keyencryption-algorithm';
import { WrappedKey } from './wrapped-key';

/**
 * Implementation of the Section 4 of RFC 7518.
 *
 * This class provides the expected **Key Wrapping Algorithms** that will be used throughout the package.
 *
 * All JWE Algorithms **MUST** inherit from this class and implement its methods.
 */
export abstract class JsonWebEncryptionKeyWrapAlgorithm {
  /**
   * Name of the JSON Web Encryption Key Wrap Algorithm.
   */
  protected readonly algorithm: SupportedJsonWebEncryptionKeyWrapAlgorithm;

  /**
   * Instantiates a new JSON Web Encryption Key Wrap Algorithm to Wrap and Unwrap Content Encryption Keys.
   *
   * @param algorithm Name of the JSON Web Encryption Key Wrap Algorithm.
   */
  public constructor(algorithm: SupportedJsonWebEncryptionKeyWrapAlgorithm) {
    this.algorithm = algorithm;
  }

  /**
   * Wraps the provided Content Encryption Key using the provide JSON Web Key.
   *
   * @param cek Content Encryption Key used to Encrypt the Plaintext.
   * @param key JSON Web Key used to Wrap the provided Content Encryption Key.
   * @returns Wrapped Content Encryption Key and optional additional JSON Web Encryption Header Parameters.
   */
  public abstract wrap(cek: Buffer, key?: Optional<JsonWebKey>): Promise<WrappedKey<Dict>>;

  /**
   * Unwraps the provided Encrypted Key using the provided JSON Web Key.
   *
   * @param ek Wrapped Content Encryption Key.
   * @param key JSON Web Key used to Unwrap the Wrapped Content Encryption Key.
   * @param header Optional JSON Web Encryption Header containing the additional Parameters.
   * @returns Unwrapped Content Encryption Key.
   */
  public abstract unwrap(ek: Buffer, key: JsonWebKey, header?: Optional<Dict>): Promise<Buffer>;
}
