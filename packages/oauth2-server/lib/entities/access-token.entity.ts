import { SupportedGrantType } from '../grant-types/types/supported-grant-type';
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
   * Grant Type that generated the Access Token.
   */
  readonly grant: SupportedGrantType;

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
