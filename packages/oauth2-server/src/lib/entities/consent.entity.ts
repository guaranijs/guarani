import { Dictionary, Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Consent Entity.
 */
export abstract class Consent implements Dictionary<any> {
  /**
   * Identifier of the Consent.
   */
  public readonly id!: string;

  /**
   * Scopes granted by the Authenticated End User.
   */
  public readonly scopes!: string[];

  /**
   * Creation Date of the Consent.
   */
  public readonly createdAt!: Date;

  /**
   * Expiration Date of the Consent.
   *
   * *note: a **null** value indicates that the consent does not expire.*
   */
  public readonly expiresAt!: Nullable<Date>;

  /**
   * Client authorized by the Authenticated End User.
   */
  public readonly client!: Client;

  /**
   * Authenticated End User.
   */
  public readonly user!: User;

  /**
   * Additional Consent Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Consent.
   */
  public get isExpired(): boolean {
    return this.expiresAt !== null && new Date() >= this.expiresAt;
  }
}
