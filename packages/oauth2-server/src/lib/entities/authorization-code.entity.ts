import { PkceMethod } from '../pkce/pkce-method.type';
import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Authorization Code Entity.
 */
export interface AuthorizationCode extends Record<string, any> {
  /**
   * Identifier of the Authorization Code.
   */
  readonly code: string;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];

  /**
   * Redirect URI provided by the Client.
   */
  readonly redirectUri: string;

  /**
   * Code Challenge provided by the Client.
   */
  readonly codeChallenge: string;

  /**
   * PKCE Code Challenge Method used to verify the Code Challenge.
   */
  readonly codeChallengeMethod: PkceMethod;

  /**
   * Revocation status of the Authorization Code.
   */
  isRevoked: boolean;

  /**
   * Issuance Date of the Authorization Code.
   */
  readonly issuedAt: Date;

  /**
   * Expiration Date of the Authorization Code.
   */
  readonly expiresAt: Date;

  /**
   * Date when the Authorization Code will become valid.
   */
  readonly validAfter: Date;

  /**
   * Client that requested the Authorization Code.
   */
  readonly client: Client;

  /**
   * End User that granted authorization to the Client.
   */
  readonly user: User;
}
