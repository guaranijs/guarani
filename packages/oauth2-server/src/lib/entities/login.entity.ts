import { Dictionary, Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { Session } from './session.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Login Entity.
 */
export abstract class Login implements Dictionary<any> {
  /**
   * Identifier of the Login.
   */
  public readonly id!: string;

  /**
   * Authentication Methods used in the Authentication.
   */
  public readonly amr!: Nullable<string[]>;

  /**
   * Authentication Context Class Reference satisfied by the Authentication process.
   */
  public readonly acr!: Nullable<string>;

  /**
   * Creation Date of the Login.
   */
  public readonly createdAt!: Date;

  /**
   * Expiration Date of the Login.
   *
   * *note: a **null** value indicates that the login does not expire.*
   */
  public readonly expiresAt!: Nullable<Date>;

  /**
   * Authenticated End User.
   */
  public readonly user!: User;

  /**
   * Session to which the Login was created.
   */
  public readonly session!: Session;

  /**
   * Clients that were authorized by this Login.
   */
  public readonly clients!: Client[];

  /**
   * Additional Login Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Login.
   */
  public get isExpired(): boolean {
    return this.expiresAt !== null && new Date() >= this.expiresAt;
  }
}
