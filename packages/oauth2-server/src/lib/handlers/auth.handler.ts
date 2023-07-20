import { Inject, Injectable } from '@guarani/di';

import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
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
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface
  ) {}

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

  /**
   * Updates the Active Login of the Session and adds the Login to the list of Logins of the Session,
   * while removing an older version of the Login if it is present.
   *
   * @param session Session of the Request.
   * @param login Login to be added to the Session.
   */
  // TODO: Check for acr_values and max_age.
  public async updateActiveLogin(session: Session, login: Login): Promise<void> {
    const oldLogin = session.logins.find((oldLogin) => oldLogin.user.id === login.user.id);

    if (typeof oldLogin !== 'undefined') {
      session.logins = session.logins.filter((sessionLogin) => sessionLogin.id !== oldLogin.id);
      await this.loginService.remove(oldLogin);
    }

    session.activeLogin = login;
    session.logins.push(login);

    await this.sessionService.save(session);
  }
}
