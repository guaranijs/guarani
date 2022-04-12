import { SupportedPkceMethod } from '../pkce/types/supported-pkce-method';
import { ClientEntity } from './client.entity';
import { UserEntity } from './user.entity';

/**
 * Representation of the OAuth 2.0 Authorization Code.
 */
export interface AuthorizationCodeEntity {
  /**
   * String representation of the Authorization Code.
   */
  readonly code: string;

  /**
   * Redirect URI provided by the Client.
   */
  readonly redirectUri: URL;

  /**
   * Scopes granted to the Authorization Code.
   */
  readonly scopes: string[];

  /**
   * Code Challenge provided by the Client.
   */
  readonly codeChallenge: string;

  /**
   * Code Challenge Method used to verify the Code Challenge.
   */
  readonly codeChallengeMethod: SupportedPkceMethod;

  /**
   * Informs whether or not the Authorization Code is revoked.
   */
  readonly isRevoked: boolean;

  /**
   * Lifetime of the Authorization Code in seconds.
   */
  readonly lifetime: number;

  /**
   * Date when the Authorization Code was issued.
   */
  readonly createdAt: Date;

  /**
   * Client that requested the Authorization Code.
   */
  readonly client: ClientEntity;

  /**
   * User that granted access to the Client.
   */
  readonly user: UserEntity;
}
