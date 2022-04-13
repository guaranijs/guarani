import { Dict } from '@guarani/types';

import { SupportedGrantType } from '../grant-types/types/supported-grant-type';
import { ClientEntity } from './client.entity';
import { UserEntity } from './user.entity';

export interface RefreshTokenEntity extends Dict {
  /**
   * String representation of the Refresh Token.
   */
  readonly token: string;

  /**
   * Scopes granted to the Refresh Token.
   */
  readonly scopes: string[];

  /**
   * Grant Type that generated the Refresh Token.
   */
  readonly grant: SupportedGrantType;

  /**
   * Informs whether or not the Refresh Token is revoked.
   */
  readonly isRevoked: boolean;

  /**
   * Expiration Date of the Refresh Token.
   */
  readonly expiresAt: Date;

  /**
   * Client that requested the Refresh Token.
   */
  readonly client: ClientEntity;

  /**
   * User that granted access to the Client.
   */
  readonly user: UserEntity;
}
