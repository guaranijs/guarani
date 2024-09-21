import { RequestOptions } from 'http';
import { stringify as stringifyQs } from 'querystring';

import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { User } from '../entities/user.entity';
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param logoutTokenHandler Instance of the Logout Token Handler.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
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
    this.logger.debug(`[${this.constructor.name}] Called notifyClient()`, '93069b96-66aa-4fb0-8c5c-0d307a858c0b', {
      client,
      user,
      login,
    });

    switch (true) {
      case client.backChannelLogoutUri !== null:
        // eslint-disable-next-line @typescript-eslint/no-empty-function
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
    this.logger.debug(
      `[${this.constructor.name}] Called notifyBackChannelClient()`,
      'a7a4201c-d1fa-422e-8f82-05b8b691eb42',
      { client, user, login },
    );

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

        res.on('end', () => {
          this.logger.debug(
            `[${this.constructor.name}] Sucessfully notified the Backend Client "${client.id}"`,
            'b83eb57b-5fd8-4508-b65c-7bf2ec2df00e',
            { client, logout_token: logoutToken },
          );

          resolve();
        });
      });

      req.on('error', () => {
        const exc = new Error(`Could not notify the client "${client.id}".`);

        this.logger.error(
          `[${this.constructor.name}] Could not notify the client "${client.id}"`,
          '5669a830-b3b4-40cb-98ae-c96c2a89b496',
          { client, logout_token: logoutToken },
          exc,
        );

        reject(exc);
      });

      req.on('timeout', () => {
        req.destroy();

        const exc = new Error(`Client "${client.id}" timed-out.`);

        this.logger.error(
          `[${this.constructor.name}] Client "${client.id}" timed-out`,
          '6cea5df9-dc55-4725-885f-947fb5a1d2d0',
          { client, logout_token: logoutToken },
          exc,
        );

        reject(exc);
      });

      req.write(body);
      req.end();
    });
  }
}
