import { EndSessionRequest } from '../requests/end-session-request';
import { Client } from './client.entity';
import { Session } from './session.entity';

/**
 * OAuth 2.0 Logout Ticket Entity.
 */
export interface LogoutTicket {
  /**
   * Identifier of the Logout Ticket.
   */
  readonly id: string;

  /**
   * Logout Challenge of the Logout Ticket.
   */
  readonly logoutChallenge: string;

  /**
   * Parameters of the End Session Request.
   */
  readonly parameters: EndSessionRequest;

  /**
   * Creation Date of the Logout Ticket.
   */
  readonly createdAt: Date;

  /**
   * Expiration Date of the Logout Ticket.
   */
  readonly expiresAt: Date;

  /**
   * Client requesting logout.
   */
  readonly client: Client;

  /**
   * Session of the User-Agent.
   */
  session: Session;
}
