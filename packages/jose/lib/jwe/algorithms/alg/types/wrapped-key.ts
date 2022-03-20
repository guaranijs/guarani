import { Dict, Optional } from '@guarani/types';

/**
 * Parameters that represent the Key Wrapping result.
 */
export interface WrappedKey<AdditionalJoseHeaderParams extends Dict> {
  /**
   * Content Encryption Key.
   */
  readonly cek: Buffer;

  /**
   * Wrapped Content Encryption Key.
   */
  readonly ek: Buffer;

  /**
   * Additional JSON Web Encryption Header Parameters.
   */
  readonly additionalHeaderParams?: Optional<AdditionalJoseHeaderParams>;
}
