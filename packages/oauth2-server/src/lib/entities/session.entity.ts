import { AuthorizationRequest } from '../messages/authorization-request';
import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Session Entity.
 */
export interface Session {
  /**
   * Identifier of the Session.
   */
  readonly id: string;

  /**
   * Parameters of the Authorization Request.
   */
  readonly parameters: AuthorizationRequest;

  /**
   * Creation Date of the Session.
   */
  readonly createdAt: Date;

  /**
   * Expiration Date of the Session.
   *
   * *note: a **null** or **undefined** value indicates that the grant does not expire.*
   */
  readonly expiresAt?: Date | null;

  /**
   * Client requesting authorization.
   */
  readonly client: Client;

  /**
   * Authenticated End User.
   */
  user: User | null;
}
