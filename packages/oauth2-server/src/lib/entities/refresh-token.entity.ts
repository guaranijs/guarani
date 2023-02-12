import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Refresh Token Entity.
 */
export interface RefreshToken extends Record<string, any> {
  /**
   * Identifier of the Refresh Token.
   */
  readonly handle: string;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];

  /**
   * Revocation status of the Refresh Token.
   */
  isRevoked: boolean;

  /**
   * Issuance Date of the Refresh Token.
   */
  readonly issuedAt: Date;

  /**
   * Expiration Date of the Refresh Token.
   */
  readonly expiresAt: Date;

  /**
   * Date when the Refresh Token will become valid.
   */
  readonly validAfter: Date;

  /**
   * Client that requested the Refresh Token.
   */
  readonly client: Client;

  /**
   * End User that granted authorization to the Client.
   */
  readonly user: User;
}
