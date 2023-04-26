import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Access Token Entity.
 */
export interface AccessToken extends Record<string, any> {
  /**
   * Identifier of the Access Token.
   */
  readonly handle: string;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];

  /**
   * Revocation status of the Access Token.
   */
  isRevoked: boolean;

  /**
   * Issuance Date of the Access Token.
   */
  readonly issuedAt: Date;

  /**
   * Expiration Date of the Access Token.
   */
  readonly expiresAt: Date;

  /**
   * Date when the Access Token will become valid.
   */
  readonly validAfter: Date;

  /**
   * Client that requested the Access Token.
   */
  readonly client?: Client | null;

  /**
   * End User that granted authorization to the Client.
   */
  readonly user?: User | null;
}
