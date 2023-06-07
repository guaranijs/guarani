import { Nullable } from '@guarani/types';

import { Session } from './session.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Login Entity.
 */
export interface Login {
  /**
   * Identifier of the Login.
   */
  readonly id: string;

  /**
   * Authentication Methods used in the Authentication.
   */
  readonly amr: Nullable<string[]>;

  /**
   * Authentication Context Class Reference satisfied by the Authentication process.
   */
  readonly acr: Nullable<string>;

  /**
   * Creation Date of the Login.
   */
  readonly createdAt: Date;

  /**
   * Expiration Date of the Login.
   *
   * *note: a **null** value indicates that the login does not expire.*
   */
  readonly expiresAt: Nullable<Date>;

  /**
   * Authenticated End User.
   */
  readonly user: User;

  /**
   * Session to which the Login was created.
   */
  readonly session: Session;
}
