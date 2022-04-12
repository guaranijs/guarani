import { ClientEntity } from './client.entity';
import { UserEntity } from './user.entity';

/**
 * Representation of the OAuth 2.0 Access Token.
 */
export interface AccessTokenEntity {
  /**
   * String representation of the Access Token.
   */
  readonly token: string;

  /**
   * Scopes granted to the Access Token.
   */
  readonly scopes: string[];

  /**
   * Informs whether or not the Access Token is revoked.
   */
  readonly isRevoked: boolean;

  /**
   * Lifetime of the Access Token in seconds.
   */
  readonly lifetime: number;

  /**
   * Date when the Access Token was issued.
   */
  readonly createdAt: Date;

  /**
   * Client that requested the Access Token.
   */
  readonly client: ClientEntity;

  /**
   * User that granted access to the Client.
   */
  readonly user: UserEntity;
}
