import { Dictionary } from '@guarani/types';

import { TokenTypeHint } from '../types/token-type-hint.type';

/**
 * Parameters of the OAuth 2.0 Revocation Request.
 */
export interface RevocationRequest extends Dictionary<unknown> {
  /**
   * Token to be revoked.
   */
  readonly token: string;

  /**
   * Optional hint about the type of the Token.
   */
  readonly token_type_hint?: TokenTypeHint;
}
