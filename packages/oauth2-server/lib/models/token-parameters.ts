import { Dict } from '@guarani/types';
import { GrantType } from '../types/grant-type';

/**
 * Parameters of the OAuth 2.0 Token Request.
 */
export interface TokenParameters extends Dict {
  /**
   * Grant Type requested by the Client.
   */
  readonly grant_type: GrantType;
}
