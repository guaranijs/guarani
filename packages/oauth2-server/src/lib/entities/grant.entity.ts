import { AuthorizationRequest } from '../messages/authorization-request';
import { Client } from './client.entity';
import { Consent } from './consent.entity';
import { Session } from './session.entity';

/**
 * OAuth 2.0 Grant Entity.
 */
export interface Grant extends Record<string, any> {
  /**
   * Identifier of the Grant.
   */
  readonly id: string;

  /**
   * Login Challenge of the Grant.
   */
  readonly loginChallenge: string;

  /**
   * Consent Challenge of the Grant.
   */
  readonly consentChallenge: string;

  /**
   * Parameters of the Authorization Request.
   */
  readonly parameters: AuthorizationRequest;

  /**
   * Creation Date of the Grant.
   */
  readonly createdAt: Date;

  /**
   * Expiration Date of the Grant.
   */
  readonly expiresAt: Date;

  /**
   * Client requesting authorization.
   */
  readonly client: Client;

  /**
   * End User Session.
   */
  session?: Session | null;

  /**
   * End User Consent.
   */
  consent?: Consent | null;
}
