import { Optional } from '@guarani/types';

import { JsonWebKey } from '../../jwk/jsonwebkey';

/**
 * JSON Web Encryption Compact Serialization Options.
 */
export interface CompactSerializationOptions {
  /**
   * Initialization Vector.
   */
  readonly iv?: Optional<Buffer>;

  /**
   * Content Encryption Key used to Encrypt the Plaintext.
   */
  readonly cek?: Optional<Buffer>;

  /**
   * JSON Web Key used to Wrap the Content Encryption Key.
   */
  readonly wrapKey?: Optional<JsonWebKey>;
}
