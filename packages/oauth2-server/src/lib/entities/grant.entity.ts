import { Dictionary, Nullable } from '@guarani/types';

import { InteractionType } from '../interaction-types/interaction-type.type';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { Client } from './client.entity';
import { Consent } from './consent.entity';
import { Session } from './session.entity';

/**
 * OAuth 2.0 Grant Entity.
 */
export abstract class Grant implements Dictionary<any> {
  /**
   * Identifier of the Grant.
   */
  public readonly id!: string;

  /**
   * Login Challenge of the Grant.
   */
  public readonly loginChallenge!: string;

  /**
   * Consent Challenge of the Grant.
   */
  public readonly consentChallenge!: string;

  /**
   * Parameters of the Authorization Request.
   */
  public readonly parameters!: AuthorizationRequest;

  /**
   * Interactions processed by the Authorization Server.
   */
  public readonly interactions!: InteractionType[];

  /**
   * Creation Date of the Grant.
   */
  public readonly createdAt!: Date;

  /**
   * Expiration Date of the Grant.
   */
  public readonly expiresAt!: Date;

  /**
   * Client requesting authorization.
   */
  public readonly client!: Client;

  /**
   * Session for the User-Agent.
   */
  public readonly session!: Session;

  /**
   * End User Consent.
   */
  public consent!: Nullable<Consent>;

  /**
   * Additional Grant Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Grant.
   */
  public get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }
}
