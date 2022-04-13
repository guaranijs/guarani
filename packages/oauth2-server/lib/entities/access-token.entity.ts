import { Dict, Optional } from '@guarani/types';

import { SupportedTokenType } from '../types/supported-token-type';
import { ClientEntity } from './client.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { UserEntity } from './user.entity';

/**
 * Representation of the OAuth 2.0 Access Token.
 */
export interface AccessTokenEntity extends Dict {
  /**
   * String representation of the Access Token.
   */
  readonly token: string;

  /**
   * Type of the Access Token.
   */
  readonly tokenType: SupportedTokenType;

  /**
   * Scopes granted to the Access Token.
   */
  readonly scopes: string[];

  /**
   * Informs whether or not the Access Token is revoked.
   */
  readonly isRevoked: boolean;

  /**
   * Expiration Date of the Access Token.
   */
  readonly expiresAt: Date;

  /**
   * Client that requested the Access Token.
   */
  readonly client: ClientEntity;

  /**
   * User that granted access to the Client.
   */
  readonly user?: Optional<UserEntity>;

  /**
   * Refresh Token that generated the Access Token.
   */
  readonly refreshToken?: Optional<RefreshTokenEntity>;
}
