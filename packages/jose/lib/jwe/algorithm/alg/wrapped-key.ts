import { Dict, Optional } from '@guarani/types';

/**
 * Parameters that represent the Key Wrapping result.
 */
export interface WrappedKey<AdditionalJoseHeaderParams extends Dict> {
  /**
   * Wrapped Content Encryption Key.
   */
  readonly ek: Buffer;

  /**
   * Additional JSON Web Encryption Header Parameters.
   */
  readonly header?: Optional<AdditionalJoseHeaderParams>;
}
