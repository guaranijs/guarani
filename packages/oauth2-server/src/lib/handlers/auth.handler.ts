import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
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
   * @param sessionService Instance of the Session Service.
   * @param loginService Instance of the Login Service.
   */
  public constructor(
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface,
  ) {}

  /**
   * Authenticates the End User with the Authorization Server and returns the resulting Login.
   *
   * @param user End User to be authenticated.
   * @param session Session where the Login will be recorded.
   * @param amr Authentication Methods used in the Authentication.
   * @param acr Authentication Context Class Reference satisfied by the Authentication process.
   * @returns Login representing the Authentication of the End User.
   */
  public async login(user: User, session: Session, amr: Nullable<string[]>, acr: Nullable<string>): Promise<Login> {
    const login = await this.loginService.create(user, session, amr, acr);

    const oldLogin = session.logins.find((oldLogin) => oldLogin.user.id === login.user.id);

    if (typeof oldLogin !== 'undefined') {
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
  public async logout(login: Login, session: Session): Promise<void> {
    await this.loginService.remove(login);

    if (session.activeLogin !== null && session.activeLogin.id === login.id) {
      session.activeLogin = null;
    }

    session.logins = session.logins.filter((savedLogin) => savedLogin.id !== login.id);
    await this.sessionService.save(session);
  }

  /**
   * Inactivates the Active Login from the User-Agent's Session.
   * This does not remove the actual Login from the storage, only makes it inactive on the Session.
   *
   * @param session Session of the User-Agent.
   */
  public async inactivateSessionActiveLogin(session: Session): Promise<void> {
    session.activeLogin = null;
    await this.sessionService.save(session);
  }
}
