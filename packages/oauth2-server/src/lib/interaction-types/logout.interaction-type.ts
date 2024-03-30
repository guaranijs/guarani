import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';

import { LogoutContextInteractionContext } from '../context/interaction/logout-context.interaction-context';
import { LogoutDecisionInteractionContext } from '../context/interaction/logout-decision.interaction-context';
import { LogoutDecisionAcceptInteractionContext } from '../context/interaction/logout-decision-accept.interaction-context';
import { LogoutDecisionDenyInteractionContext } from '../context/interaction/logout-decision-deny.interaction-context';
import { LogoutTicket } from '../entities/logout-ticket.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { Logger } from '../logger/logger';
import { LogoutContextInteractionResponse } from '../responses/interaction/logout-context.interaction-response';
import { LogoutDecisionInteractionResponse } from '../responses/interaction/logout-decision.interaction-response';
import { LogoutTicketServiceInterface } from '../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../services/logout-ticket.service.token';
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
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param logoutTicketService Instance of the Logout Ticket Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(LOGOUT_TICKET_SERVICE) private readonly logoutTicketService: LogoutTicketServiceInterface,
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
    this.logger.debug(`[${this.constructor.name}] Called handleContext()`, '4e11c695-1500-4c15-8dc6-e15d3ed0c485', {
      context,
    });

    const { logoutTicket } = context;

    await this.checkLogoutTicket(logoutTicket);

    const url = addParametersToUrl(new URL('/oauth/end_session', this.settings.issuer), logoutTicket.parameters);

    const response: LogoutContextInteractionResponse = {
      skip: logoutTicket.session.activeLogin === null,
      request_url: url.href,
      client: logoutTicket.client.id,
      context: {
        logout_hint: logoutTicket.parameters.logout_hint,
        ui_locales: logoutTicket.parameters.ui_locales?.split(' '),
      },
    };

    this.logger.debug(
      `[${this.constructor.name}] Logout Context Interaction completed`,
      '007d6739-fc5d-4a8d-8849-c52628aae62e',
      { response },
    );

    return response;
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
    this.logger.debug(`[${this.constructor.name}] Called handleContext()`, 'b2388b95-7321-4efd-9d2e-040d06c33f1c', {
      context,
    });

    const { decision, logoutTicket } = context;

    await this.checkLogoutTicket(logoutTicket);

    switch (decision) {
      case 'accept': {
        const response = await this.acceptLogout(<LogoutDecisionAcceptInteractionContext>context);

        this.logger.debug(
          `[${this.constructor.name}] Logout Decision Interaction completed`,
          'bb8fd0cf-4f8b-43fa-b47b-2ad9c809165f',
          { decision, response },
        );

        return response;
      }

      case 'deny': {
        const response = await this.denyLogout(<LogoutDecisionDenyInteractionContext>context);

        this.logger.debug(
          `[${this.constructor.name}] Logout Decision Interaction completed`,
          'abd1cfd8-91f1-4c96-aa29-ccb7f96f5513',
          { decision, response },
        );

        return response;
      }
    }
  }

  /**
   * Accepts the logout performed by the application and redirects the User-Agent to continue the Logout Process.
   *
   * @param context Logout Decision Interaction Context.
   * @returns Logout Decision Interaction Response.
   */
  private async acceptLogout(
    context: LogoutDecisionAcceptInteractionContext,
  ): Promise<LogoutDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called acceptLogout()`, '9dded0af-bb61-4778-9e94-7d61e15fcbb5', {
      context,
    });

    const { logoutTicket, logoutType, session } = context;

    if (session.activeLogin !== null) {
      await logoutType.logout(logoutTicket);

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
    this.logger.debug(`[${this.constructor.name}] Called denyLogout()`, '98014906-e610-45d5-a73f-78e91572ce70', {
      context,
    });

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
    this.logger.debug(`[${this.constructor.name}] Called checkLogoutTicket()`, '242f7e59-5b9f-4de1-8336-1f963b99bf12', {
      logout_ticket: logoutTicket,
    });

    if (new Date() > logoutTicket.expiresAt) {
      await this.logoutTicketService.remove(logoutTicket);

      const exc = new AccessDeniedException('Expired Logout Ticket.');

      this.logger.error(
        `[${this.constructor.name}] Expired Logout Ticket`,
        'fdd47c2f-0f88-49f3-8182-5c45420986a2',
        { logout_ticket: logoutTicket },
        exc,
      );

      throw exc;
    }
  }
}
