import { RequestOptions } from 'http';
import { stringify as stringifyQs } from 'querystring';

import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { User } from '../entities/user.entity';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { LogoutTokenHandler } from './logout-token.handler';

/**
 * Handler used to aggregate the operations adjacent to a User Logout.
 */
@Injectable()
export class LogoutHandler {
  /**
   * Instantiates a new Logout Handler.
   *
   * @param logoutTokenHandler Instance of the Logout Token Handler.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly logoutTokenHandler: LogoutTokenHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
  ) {}

  /**
   * Notifies the Client about the Logout operation being executed.
   *
   * @param client Client to be notified about the Logout.
   * @param user User being logged out. (Only include if you need to provide the User Identifier)
   * @param login Login being finished.
   */
  public async notifyClient(client: Client, user: Nullable<User>, login: Login): Promise<void> {
    switch (true) {
      case client.backChannelLogoutUri !== null:
        return await this.notifyBackChannelClient(client, user, login).catch(() => {});
    }
  }

  /**
   * Notifies the Client about the Logout operation being executed through the Back Channel URL.
   *
   * @param client Client to be notified about the Logout.
   * @param user User being logged out. (Only include if you need to provide the User Identifier)
   * @param login Login being finished.
   */
  private async notifyBackChannelClient(client: Client, user: Nullable<User>, login: Login): Promise<void> {
    const includeSidClaim =
      client.backChannelLogoutSessionRequired === true || this.settings.includeSessionIdInLogoutToken;

    const logoutToken = await this.logoutTokenHandler.generateLogoutToken(client, user, includeSidClaim ? login : null);
    const body = stringifyQs({ logout_token: logoutToken });

    const options: RequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': body.length,
      },
      timeout: 5000,
    };

    const { request } = client.backChannelLogoutUri!.startsWith('https') ? await import('https') : await import('http');

    return new Promise<void>((resolve, reject) => {
      const req = request(client.backChannelLogoutUri!, options, (res) => {
        res.on('data', () => null);
        res.on('end', () => resolve());
      });

      req.on('error', () => {
        reject(new Error(`Could not notify the client "${client.id}".`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Client "${client.id}" timed-out.`));
      });

      req.write(body);
      req.end();
    });
  }
}
