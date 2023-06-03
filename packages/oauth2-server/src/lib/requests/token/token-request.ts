import { Dictionary } from '@guarani/types';

import { GrantType } from '../../grant-types/grant-type.type';

/**
 * Parameters of the OAuth 2.0 Token Request.
 */
export interface TokenRequest extends Dictionary<unknown> {
  /**
   * Grant Type requested by the Client.
   */
  readonly grant_type: GrantType;
}
