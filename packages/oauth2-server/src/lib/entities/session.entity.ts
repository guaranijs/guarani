import { User } from './user.entity';

/**
 * OAuth 2.0 Session Entity.
 */
export interface Session extends Record<string, any> {
  /**
   * Identifier of the Session.
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
   * Creation Date of the Session.
   */
  readonly createdAt: Date;

  /**
   * Expiration Date of the Session.
   *
   * *note: a **null** or **undefined** value indicates that the session does not expire.*
   */
  readonly expiresAt?: Date | null;

  /**
   * Authenticated End User.
   */
  readonly user: User;
}
