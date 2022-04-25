import { SupportedGrantType } from '../grant-types/types/supported-grant-type';
import { AbstractToken } from './abstract-token';
import { UserEntity } from './user.entity';

/**
 * Representation of the OAuth 2.0 Refresh Token.
 */
export interface RefreshTokenEntity extends AbstractToken {
  /**
   * Grant Type that generated the Refresh Token.
   */
  readonly grant: SupportedGrantType;

  /**
   * User that granted access to the Client.
   */
  readonly user: UserEntity;
}
