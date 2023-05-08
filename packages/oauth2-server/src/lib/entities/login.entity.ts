import { Session } from './session.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Login Entity.
 */
export interface Login extends Record<string, any> {
  /**
   * Identifier of the Login.
   */
  readonly id: string;

  /**
   * Authentication Methods used in the Authentication.
   */
  readonly amr?: string[] | null;

  /**
   * Authentication Context Class Reference satisfied by the Authentication process.
   */
  readonly acr?: string | null;

  /**
   * Creation Date of the Login.
   */
  readonly createdAt: Date;

  /**
   * Expiration Date of the Login.
   *
   * *note: a **null** or **undefined** value indicates that the login does not expire.*
   */
  readonly expiresAt?: Date | null;

  /**
   * Authenticated End User.
   */
  readonly user: User;

  /**
   * Session to which the Login was created.
   */
  readonly session: Session;
}
