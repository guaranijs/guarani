import { Dict, Optional } from '@guarani/types';

import { TokenTypeHint } from '../types/token-type-hint';

/**
 * Parameters of the OAuth 2.0 Revocation Request.
 */
export interface RevocationParameters extends Dict {
  /**
   * Token to be revoked.
   */
  readonly token: string;

  /**
   * Optional hint about the type of the Token.
   */
  readonly token_type_hint?: Optional<TokenTypeHint>;
}
