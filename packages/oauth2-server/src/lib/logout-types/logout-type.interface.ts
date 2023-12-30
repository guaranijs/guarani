import { LogoutTicket } from '../entities/logout-ticket.entity';
import { LogoutType } from './logout-type.type';

/**
 * Interface of a Logout Type.
 */
export interface LogoutTypeInterface {
  /**
   * Name of the Logout Type.
   */
  readonly name: LogoutType;

  /**
   * Logs the User out and notifies the Clients about the process.
   *
   * @param logoutTicket Logout Ticket provided by the Client.
   */
  logout(logoutTicket: LogoutTicket): Promise<void>;
}
