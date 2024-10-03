import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';

/**
 * Handler used to aggregate the Auth operations of the Authorization Server.
 */
@Injectable()
export class AuthHandler {
  /**
   * Instantiates a new Auth Handler.
   *
   * @param logger Logger of the Authorization Server.
   * @param sessionService Instance of the Session Service.
   * @param loginService Instance of the Login Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface,
  ) {}

  /**
   * Authenticates the End User with the Authorization Server and returns the resulting Login.
   *
   * @param user End User to be authenticated.
   * @param client Client requesting Login.
   * @param session Session where the Login will be recorded.
   * @param amr Authentication Methods used in the Authentication.
   * @param acr Authentication Context Class Reference satisfied by the Authentication process.
   * @returns Login representing the Authentication of the End User.
   */
  public async login(
    user: User,
    client: Client,
    session: Session,
    amr: Nullable<string[]>,
    acr: Nullable<string>,
  ): Promise<Login> {
    this.logger.debug(`[${this.constructor.name}] Called login()`, 'fd8bea29-73f3-41b2-9f4d-b0c8c20e0f0e', {
      user,
      client,
      session,
      amr,
      acr,
    });

    const login = await this.loginService.create(user, client, session, amr, acr);

    const oldLogin = session.logins.find((oldLogin) => oldLogin.user.id === login.user.id);

    if (typeof oldLogin !== 'undefined') {
      this.logger.debug(`[${this.constructor.name}] Removing old Login`, 'b22695e6-87af-4e19-bb1d-c265db9898eb', {
        old_login: oldLogin,
      });

      session.logins = session.logins.filter((sessionLogin) => sessionLogin.id !== oldLogin.id);
      await this.loginService.remove(oldLogin);
    }

    session.activeLogin = login;
    session.logins.push(login);

    await this.sessionService.save(session);

    return login;
  }

  /**
   * Logs out the Authenticated End User represented by the provided Login.
   *
   * @param login Login to be destroyed.
   * @param session Session of the User-Agent.
   */
  // TODO: Add Login / Session ID to Access Tokens and etc
  public async logout(login: Login, session: Session): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called logout()`, '5bfc412f-848a-4bd3-87eb-fc874b125360', {
      login,
      session,
    });

    if (session.activeLogin !== null && session.activeLogin.id === login.id) {
      this.logger.debug(
        `[${this.constructor.name}] Invalidating active Login`,
        'a29d75e3-606e-4643-b5d3-26f4a0314e64',
        { active_login: session.activeLogin },
      );

      session.activeLogin = null;
    }

    session.logins = session.logins.filter((savedLogin) => savedLogin.id !== login.id);

    await this.loginService.remove(login);
    await this.sessionService.save(session);
  }

  /**
   * Inactivates the Active Login from the User-Agent's Session.
   * This does not remove the actual Login from the storage, only makes it inactive on the Session.
   *
   * @param session Session of the User-Agent.
   */
  public async inactivateSessionActiveLogin(session: Session): Promise<void> {
    this.logger.debug(
      `[${this.constructor.name}] Called inactivateSessionActiveLogin()`,
      '480caa4a-ad64-4f1a-93f1-53fccf0f96ad',
      { session },
    );

    session.activeLogin = null;
    await this.sessionService.save(session);
  }

  /**
   * Searches the application for an Authenticated End User.
   *
   * @param request Http Request.
   * @returns Authenticated User.
   */
  public async findAuthUser(request: HttpRequest): Promise<Nullable<User>> {
    this.logger.debug(`[${this.constructor.name}] Called findAuthUser()`, 'c2611dc3-ec91-4dab-8acb-8d4e656ffa99', {
      request,
    });

    if (!Object.hasOwn(request.cookies, 'guarani:session')) {
      return null;
    }

    const sessionId = request.cookies['guarani:session'] as string;
    const session = await this.sessionService.findOne(sessionId);

    return session?.activeLogin?.user ?? null;
  }
}
