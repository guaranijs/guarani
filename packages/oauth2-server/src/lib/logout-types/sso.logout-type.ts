import { Inject, Injectable } from '@guarani/di';

import { LogoutTicket } from '../entities/logout-ticket.entity';
import { AuthHandler } from '../handlers/auth.handler';
import { LogoutHandler } from '../handlers/logout.handler';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { LogoutTypeInterface } from './logout-type.interface';
import { LogoutType } from './logout-type.type';

/**
 * Implementation of the **SSO** Logout Type.
 *
 * This Logout Type is used to log a user out from all clients across all sessions,
 * meaning it will affect logins from other devices.
 */
@Injectable()
export class SsoLogoutType implements LogoutTypeInterface {
  /**
   * Name of the Logout Type.
   */
  public readonly name: LogoutType = 'sso';

  /**
   * Instantiates a new Local Logout Type.
   *
   * @param authHandler Instance of the Auth Handler.
   * @param logoutHandler Instance of the Logout Handler.
   * @param loginService Instance of the Login Service.
   */
  public constructor(
    private readonly authHandler: AuthHandler,
    private readonly logoutHandler: LogoutHandler,
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface,
  ) {}

  /**
   * Logs the User out and notifies the Clients across all Sessions about the process.
   *
   * @param logoutTicket Logout Ticket provided by the Client.
   */
  public async logout(logoutTicket: LogoutTicket): Promise<void> {
    const { session } = logoutTicket;
    const { user } = session.activeLogin!;

    const logins = await this.loginService.findByUserId(user.id);

    await Promise.allSettled(
      logins.flatMap(async (login) => {
        await this.authHandler.logout(login, login.session);

        return login.clients.map(async (client) => {
          return await this.logoutHandler.notifyClient(client, user, login);
        });
      }),
    );
  }
}
