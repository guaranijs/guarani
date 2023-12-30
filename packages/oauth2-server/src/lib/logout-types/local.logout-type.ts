import { Injectable } from '@guarani/di';

import { LogoutTicket } from '../entities/logout-ticket.entity';
import { AuthHandler } from '../handlers/auth.handler';
import { LogoutHandler } from '../handlers/logout.handler';
import { LogoutTypeInterface } from './logout-type.interface';
import { LogoutType } from './logout-type.type';

/**
 * Implementation of the **Local** Logout Type.
 *
 * This Logout Type is used to log a user out from all clients of the local session,
 * meaning it will not affect logins from other devices.
 */
@Injectable()
export class LocalLogoutType implements LogoutTypeInterface {
  /**
   * Name of the Logout Type.
   */
  public readonly name: LogoutType = 'local';

  /**
   * Instantiates a new Local Logout Type.
   *
   * @param authHandler Instance of the Auth Handler.
   * @param logoutHandler Instance of the Logout Handler.
   */
  public constructor(
    private readonly authHandler: AuthHandler,
    private readonly logoutHandler: LogoutHandler,
  ) {}

  /**
   * Logs the User out and notifies the Clients of the current Session about the process.
   *
   * @param logoutTicket Logout Ticket provided by the Client.
   */
  public async logout(logoutTicket: LogoutTicket): Promise<void> {
    const { session } = logoutTicket;
    const login = session.activeLogin!;

    await this.authHandler.logout(login, session);

    await Promise.allSettled(
      login.clients.map(async (client) => {
        return await this.logoutHandler.notifyClient(client, null, login);
      }),
    );
  }
}
