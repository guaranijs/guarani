import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { Session } from '../entities/session.entity';
import { EndSessionRequest } from '../requests/end-session-request';

/**
 * Interface of the Logout Ticket Service.
 *
 * The Logout Ticket Service contains the operations regarding the OAuth 2.0 Logout Ticket.
 */
export interface LogoutTicketServiceInterface {
  /**
   * Creates a Logout Ticket used to end a Login on the Authorization Server.
   *
   * @param parameters Parameters of the End Session Request.
   * @param client Client requesting logout.
   * @param session Session containing the Logins for the User-Agent.
   * @returns Generated Logout Ticket.
   */
  create(parameters: EndSessionRequest, client: Client, session: Session): Promise<LogoutTicket>;

  /**
   * Searches the application's storage for a Logout Ticket containing the provided Identifier.
   *
   * @param id Identifier of the Logout Ticket.
   * @returns Logout Ticket based on the provided Identifier.
   */
  findOne(id: string): Promise<Nullable<LogoutTicket>>;

  /**
   * Searches the application's storage for a Logout Ticket containing the provided Logout Challenge.
   *
   * @param logoutChallenge Logout Challenge of the Logout Ticket.
   * @returns Logout Ticket based on the provided Logout Challenge.
   */
  findOneByLogoutChallenge(logoutChallenge: string): Promise<Nullable<LogoutTicket>>;

  /**
   * Persists the provided Logout Ticket into the application's storage.
   *
   * @param logoutTicket Logout Ticket to be persisted.
   */
  save(logoutTicket: LogoutTicket): Promise<void>;

  /**
   * Removes the provided Logout Ticket.
   *
   * @param logoutTicket Logout Ticket to be removed.
   */
  remove(logoutTicket: LogoutTicket): Promise<void>;
}
