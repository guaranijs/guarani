import { AuthorizationRequest } from '../messages/authorization-request';
import { Client } from './client.entity';
import { User } from './user.entity';

/**
 * OAuth 2.0 Consent Entity.
 */
export interface Consent extends Record<string, any> {
  /**
   * Identifier of the Consent.
   */
  readonly id: string;

  /**
   * Scopes granted by the Authenticated End User.
   */
  scopes: string[];

  /**
   * Login Challenge used to generate the Consent.
   */
  readonly loginChallenge: string;

  /**
   * Consent Challenge of the Consent.
   */
  readonly consentChallenge: string;

  /**
   * Parameters of the Authorization Request.
   */
  readonly parameters: AuthorizationRequest;

  /**
   * Creation Date of the Consent.
   */
  readonly createdAt: Date;

  /**
   * Expiration Date of the Consent.
   *
   * *note: a **null** or **undefined** value indicates that the consent does not expire.*
   */
  readonly expiresAt?: Date | null;

  /**
   * Client authorized by the Authenticated End User.
   */
  readonly client: Client;

  /**
   * Authenticated End User.
   */
  readonly user: User;
}
