import { Nullable } from '@guarani/types';

import { SupportedTokenType } from '../types/supported-token-type';
import { AbstractToken } from './abstract-token';
import { RefreshTokenEntity } from './refresh-token.entity';
import { UserEntity } from './user.entity';

/**
 * Representation of the OAuth 2.0 Access Token.
 */
export interface AccessTokenEntity extends AbstractToken {
  /**
   * Type of the Access Token.
   */
  readonly tokenType: SupportedTokenType;

  /**
   * User that granted access to the Client.
   */
  readonly user: Nullable<UserEntity>;

  /**
   * Refresh Token that generated the Access Token.
   */
  readonly refreshToken: Nullable<RefreshTokenEntity>;
}
