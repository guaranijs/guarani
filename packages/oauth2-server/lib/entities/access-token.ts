import { Nullable } from '@guarani/types';

import { SupportedTokenType } from '../types/supported-token-type';
import { AbstractToken } from './abstract-token';
import { RefreshToken } from './refresh-token';
import { User } from './user';

/**
 * Representation of the OAuth 2.0 Access Token.
 */
export interface AccessToken extends AbstractToken {
  /**
   * Type of the Access Token.
   */
  readonly tokenType: SupportedTokenType;

  /**
   * User that granted access to the Client.
   */
  readonly user: Nullable<User>;

  /**
   * Refresh Token that generated the Access Token.
   */
  readonly refreshToken: Nullable<RefreshToken>;
}
