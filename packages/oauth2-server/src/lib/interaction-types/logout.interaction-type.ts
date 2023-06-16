import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';

import { LogoutContextInteractionContext } from '../context/interaction/logout-context.interaction-context';
import { LogoutDecisionInteractionContext } from '../context/interaction/logout-decision.interaction-context';
import { LogoutDecisionAcceptInteractionContext } from '../context/interaction/logout-decision-accept.interaction-context';
import { LogoutDecisionDenyInteractionContext } from '../context/interaction/logout-decision-deny.interaction-context';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { LogoutContextInteractionResponse } from '../responses/interaction/logout-context.interaction-response';
import { LogoutDecisionInteractionResponse } from '../responses/interaction/logout-decision.interaction-response';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { LogoutTicketServiceInterface } from '../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../services/logout-ticket.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

/**
 * Implementation of the **Logout** Interaction Type.
 *
 * This Interaction is used by the application to request the authorization server to terminate
 * the login of the currently authenticated user.
 *
 * The Context portion of the Interaction checks if there is an authenticated end user
 * based on the provided Logout Ticket. It then informs the application whether or not to display
 * the logout page to the user.
 *
 * The Decision portion of the Interaction will deliberate on the decision to either **accept** or **deny**
 * the logout of a user based on the decision provided by the user.
 *
 * If the logout is denied, the authorization server informs the User-Agent to redirect
 * to the authorization server's post logout url and not terminate any logins it may have.
 *
 * If the logout is accepted, the authorization server informs the User-Agent to redirect
 * to the end session endpoint to continue the logout process.
 */
@Injectable()
export class LogoutInteractionType implements InteractionTypeInterface {
  /**
   * Name of the Interaction Type.
   */
  public readonly name: InteractionType = 'logout';

  /**
   * Instantiates a new Logout Interaction Type.
   *
   * @param settings Settings of the Authorization Server.
   * @param logoutTicketService Instance of the Logout Ticket Service.
   * @param loginService Instance of the Login Service.
   * @param sessionService Instance of the Session Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(LOGOUT_TICKET_SERVICE) private readonly logoutTicketService: LogoutTicketServiceInterface,
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface
  ) {}

  /**
   * Handles the Context Flow of the Logout Interaction.
   *
   * This method verifies if there is an authenticated user registered at the authorization server.
   *
   * If a user is found, it informs the application to display the logout screen and provides the necessary data,
   * otherwise, it informs the application that it can safely skip this process.
   *
   * @param context Logout Context Interaction Request Context.
   * @returns Logout Context Interaction Response.
   */
  public async handleContext(context: LogoutContextInteractionContext): Promise<LogoutContextInteractionResponse> {
    const { logoutTicket } = context;

    await this.checkLogoutTicket(logoutTicket);

    const url = addParametersToUrl(new URL('/oauth/end_session', this.settings.issuer), logoutTicket.parameters);

    return {
      skip: logoutTicket.session.activeLogin === null,
      request_url: url.href,
      client: logoutTicket.client.id,
      context: {
        logout_hint: logoutTicket.parameters.logout_hint,
        ui_locales: logoutTicket.parameters.ui_locales?.split(' '),
      },
    };
  }

  /**
   * Handles the Decision Flow of the Logout Interaction.
   *
   * This method decides whether or not to logout the end user based on the decision of the application.
   *
   * @param context Logout Decision Interaction Request Context.
   * @returns Logout Decision Interaction Response.
   */
  public async handleDecision(context: LogoutDecisionInteractionContext): Promise<LogoutDecisionInteractionResponse> {
    const { logoutTicket } = context;

    await this.checkLogoutTicket(logoutTicket);

    switch (context.decision) {
      case 'accept':
        return await this.acceptLogout(<LogoutDecisionAcceptInteractionContext>context);

      case 'deny':
        return await this.denyLogout(<LogoutDecisionDenyInteractionContext>context);
    }
  }

  /**
   * Accepts the logout performed by the application and redirects the User-Agent to continue the Logout Process.
   *
   * @param context Logout Decision Interaction Context.
   * @returns Logout Decision Interaction Response.
   */
  private async acceptLogout(
    context: LogoutDecisionAcceptInteractionContext
  ): Promise<LogoutDecisionInteractionResponse> {
    const { logoutTicket, session } = context;

    if (session.activeLogin !== null) {
      // Some implementations remove the ID after removing the entity.
      const loginId = session.activeLogin.id;

      await this.loginService.remove(session.activeLogin);

      session.logins = session.logins.filter((login) => login.id !== loginId);
      session.activeLogin = null;

      await this.sessionService.save(session);

      logoutTicket.session = session;
      await this.logoutTicketService.save(logoutTicket);
    }

    const url = addParametersToUrl(new URL('/oauth/end_session', this.settings.issuer), logoutTicket.parameters);

    return { redirect_to: url.href };
  }

  /**
   * Denies the logout performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param context Logout Decision Interaction Context.
   * @returns Logout Decision Interaction Response.
   */
  private async denyLogout(context: LogoutDecisionDenyInteractionContext): Promise<LogoutDecisionInteractionResponse> {
    const { error, logoutTicket } = context;

    await this.logoutTicketService.remove(logoutTicket);

    const url = addParametersToUrl(new URL('/oauth/error', this.settings.issuer), error.toJSON());

    return { redirect_to: url.href };
  }

  /**
   * Checks the validity of the Logout Ticket.
   *
   * @param logoutTicket Logout Ticket to be checked.
   */
  private async checkLogoutTicket(logoutTicket: LogoutTicket): Promise<void> {
    if (new Date() > logoutTicket.expiresAt) {
      await this.logoutTicketService.remove(logoutTicket);
      throw new AccessDeniedException('Expired Logout Ticket.');
    }
  }
}
