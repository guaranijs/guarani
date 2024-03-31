import { Dictionary } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Refresh Token Entity.
 */
export abstract class RefreshToken implements Dictionary<any> {
  /**
   * Identifier of the Refresh Token.
   */
  public readonly id!: string;

  /**
   * Scopes granted to the Client.
   */
  public readonly scopes!: string[];

  /**
   * Revocation status of the Refresh Token.
   */
  public isRevoked!: boolean;

  /**
   * Issuance Date of the Refresh Token.
   */
  public readonly issuedAt!: Date;

  /**
   * Expiration Date of the Refresh Token.
   */
  public readonly expiresAt!: Date;

  /**
   * Date when the Refresh Token will become valid.
   */
  public readonly validAfter!: Date;

  /**
   * Client that requested the Refresh Token.
   */
  public readonly client!: Client;

  /**
   * End User that granted authorization to the Client.
   */
  public readonly user!: User;

  /**
   * Additional Refresh Token Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Refresh Token.
   */
  public get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }
}
