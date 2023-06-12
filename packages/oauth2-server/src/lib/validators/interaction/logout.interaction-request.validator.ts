import { URLSearchParams } from 'url';

import { Inject, Injectable, InjectAll } from '@guarani/di';

import { LogoutContextInteractionContext } from '../../context/interaction/logout-context.interaction-context';
import { LogoutDecisionInteractionContext } from '../../context/interaction/logout-decision.interaction-context';
import { LogoutDecisionAcceptInteractionContext } from '../../context/interaction/logout-decision-accept.interaction-context';
import { LogoutDecisionDenyInteractionContext } from '../../context/interaction/logout-decision-deny.interaction-context';
import { LogoutTicket } from '../../entities/logout-ticket.entity';
import { Session } from '../../entities/session.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { LogoutDecision } from '../../interaction-types/logout-decision.type';
import { LogoutTicketServiceInterface } from '../../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../../services/logout-ticket.service.token';
import { SessionServiceInterface } from '../../services/session.service.interface';
import { SESSION_SERVICE } from '../../services/session.service.token';
import { InteractionRequestValidator } from './interaction-request.validator';

/**
 * Implementation of the Logout Interaction Request Validator.
 */
@Injectable()
export class LogoutInteractionRequestValidator extends InteractionRequestValidator<
  LogoutContextInteractionContext,
  LogoutDecisionInteractionContext<LogoutDecision>
> {
  /**
   * Name of the Interaction Type that uses this Validator.
   */
  public readonly name: InteractionType = 'logout';

  /**
   * Instantiates a new Logout Interaction Request Validator.
   *
   * @param logoutTicketService Instance of the Logout Ticket Service.
   * @param sessionService Instance of the Session Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    @Inject(LOGOUT_TICKET_SERVICE) private readonly logoutTicketService: LogoutTicketServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @InjectAll(INTERACTION_TYPE) protected override readonly interactionTypes: InteractionTypeInterface[]
  ) {
    super(interactionTypes);
  }

  /**
   * Validates the Http Context Interaction Request and returns the actors of the Context Interaction Context.
   *
   * @param request Http Request.
   * @returns Context Interaction Context.
   */
  public override async validateContext(request: HttpRequest): Promise<LogoutContextInteractionContext> {
    const context = await super.validateContext(request);

    const { parameters } = context;

    const logoutTicket = await this.getLogoutTicket(parameters);

    return { ...context, logoutTicket };
  }

  /**
   * Validates the Http Decision Interaction Request and returns the actors of the Decision Interaction Context.
   *
   * @param request Http Request.
   * @returns Decision Interaction Context.
   */
  public override async validateDecision(
    request: HttpRequest
  ): Promise<LogoutDecisionInteractionContext<LogoutDecision>> {
    const context = await super.validateDecision(request);

    const { parameters } = context;

    const logoutTicket = await this.getLogoutTicket(parameters);
    const decision = this.getDecision(parameters);

    Object.assign(context, { logoutTicket, decision });

    switch (decision) {
      case 'accept': {
        const session = await this.getSession(parameters);
        return <LogoutDecisionAcceptInteractionContext>{ ...context, session };
      }

      case 'deny': {
        const error = this.getError(parameters);
        return <LogoutDecisionDenyInteractionContext>{ ...context, error };
      }
    }
  }

  /**
   * Fetches the requested Logout Ticket from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Logout Ticket based on the provided Logout Challenge.
   */
  private async getLogoutTicket(parameters: URLSearchParams): Promise<LogoutTicket> {
    const logoutChallenge = parameters.get('logout_challenge');

    if (logoutChallenge === null) {
      throw new InvalidRequestException('Invalid parameter "logout_challenge".');
    }

    const logoutTicket = await this.logoutTicketService.findOneByLogoutChallenge(logoutChallenge);

    if (logoutTicket === null) {
      throw new AccessDeniedException('Invalid Logout Challenge.');
    }

    return logoutTicket;
  }

  /**
   * Checks and returns the Logout Decision provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Logout Decision provided by the Client.
   */
  private getDecision(parameters: URLSearchParams): LogoutDecision {
    const decision = parameters.get('decision');

    if (decision === null) {
      throw new InvalidRequestException('Invalid parameter "decision".');
    }

    if (decision !== 'accept' && decision !== 'deny') {
      throw new InvalidRequestException(`Unsupported decision "${decision}".`);
    }

    return decision as LogoutDecision;
  }

  /**
   * Fetches a Session from the application's storage based on the provided Session Identifier.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Session based on the provided Session Identifier.
   */
  private async getSession(parameters: URLSearchParams): Promise<Session> {
    const sessionId = parameters.get('session_id');

    if (sessionId === null) {
      throw new InvalidRequestException('Invalid parameter "session_id".');
    }

    const session = await this.sessionService.findOne(sessionId);

    if (session === null) {
      throw new AccessDeniedException('Invalid Session Identifier.');
    }

    return session;
  }

  /**
   * Checks and returns the Error Parameters provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Error object based on the Error Parameters provided by the Client.
   */
  private getError(parameters: URLSearchParams): OAuth2Exception {
    const error = parameters.get('error');
    const errorDescription = parameters.get('error_description');

    if (error === null) {
      throw new InvalidRequestException('Invalid parameter "error".');
    }

    if (errorDescription === null) {
      throw new InvalidRequestException('Invalid parameter "error_description".');
    }

    const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
      Reflect.construct(OAuth2Exception, [errorDescription]),
      { error }
    );

    return exception;
  }
}
