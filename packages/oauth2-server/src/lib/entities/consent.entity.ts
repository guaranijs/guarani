import { Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Consent Entity.
 */
export interface Consent {
  /**
   * Identifier of the Consent.
   */
  readonly id: string;

  /**
   * Scopes granted by the Authenticated End User.
   */
  readonly scopes: string[];

  /**
   * Creation Date of the Consent.
   */
  readonly createdAt: Date;

  /**
   * Expiration Date of the Consent.
   *
   * *note: a **null** or **undefined** value indicates that the consent does not expire.*
   */
  readonly expiresAt: Nullable<Date>;

  /**
   * Client authorized by the Authenticated End User.
   */
  readonly client: Client;

  /**
   * Authenticated End User.
   */
  readonly user: User;
}
