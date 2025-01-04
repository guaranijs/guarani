import { Dictionary } from '@guarani/types';

import { EndSessionRequest } from '../requests/end-session-request';
import { Client } from './client.entity';
import { Session } from './session.entity';

/**
 * OAuth 2.0 Logout Ticket Entity.
 */
export abstract class LogoutTicket implements Dictionary<unknown> {
  /**
   * Identifier of the Logout Ticket.
   */
  public readonly id!: string;

  /**
   * Logout Challenge of the Logout Ticket.
   */
  public readonly logoutChallenge!: string;

  /**
   * Parameters of the End Session Request.
   */
  public readonly parameters!: EndSessionRequest;

  /**
   * Creation Date of the Logout Ticket.
   */
  public readonly createdAt!: Date;

  /**
   * Expiration Date of the Logout Ticket.
   */
  public readonly expiresAt!: Date;

  /**
   * Client requesting logout.
   */
  public readonly client!: Client;

  /**
   * Session of the User-Agent.
   */
  public session!: Session;

  /**
   * Additional Logout Ticket Parameters.
   */
  [parameter: string]: unknown;

  /**
   * Expiration status of the Logout Ticket.
   */
  public get isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }
}
