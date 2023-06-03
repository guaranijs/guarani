import { Nullable } from '@guarani/types';

import { InteractionType } from '../interaction-types/interaction-type.type';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { Client } from './client.entity';
import { Consent } from './consent.entity';
import { Session } from './session.entity';

/**
 * OAuth 2.0 Grant Entity.
 */
export interface Grant {
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
   * Interactions processed by the Authorization Server.
   */
  readonly interactions: InteractionType[];

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
   * Session for the User-Agent.
   */
  readonly session: Session;

  /**
   * End User Consent.
   */
  consent: Nullable<Consent>;
}
