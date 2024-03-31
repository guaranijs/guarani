import { Dictionary, Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Access Token Entity.
 */
export abstract class AccessToken implements Dictionary<any> {
  /**
   * Identifier of the Access Token.
   */
  public readonly id!: string;

  /**
   * Scopes granted to the Client.
   */
  public readonly scopes!: string[];

  /**
   * Revocation status of the Access Token.
   */
  public isRevoked!: boolean;

  /**
   * Issuance Date of the Access Token.
   */
  public readonly issuedAt!: Date;

  /**
   * Expiration Date of the Access Token.
   */
  public readonly expiresAt!: Date;

  /**
   * Date when the Access Token will become valid.
   */
  public readonly validAfter!: Date;

  /**
   * Client that requested the Access Token.
   */
  public readonly client!: Nullable<Client>;

  /**
   * End User that granted authorization to the Client.
   */
  public readonly user!: Nullable<User>;

  /**
   * Additional Access Token Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Access Token.
   */
  public get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }
}
