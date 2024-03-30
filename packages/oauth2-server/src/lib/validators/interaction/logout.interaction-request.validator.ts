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
import { Logger } from '../../logger/logger';
import { LogoutTypeInterface } from '../../logout-types/logout-type.interface';
import { LOGOUT_TYPE } from '../../logout-types/logout-type.token';
import { LogoutContextInteractionRequest } from '../../requests/interaction/logout-context.interaction-request';
import { LogoutDecisionInteractionRequest } from '../../requests/interaction/logout-decision.interaction-request';
import { LogoutDecisionAcceptInteractionRequest } from '../../requests/interaction/logout-decision-accept.interaction-request';
import { LogoutDecisionDenyInteractionRequest } from '../../requests/interaction/logout-decision-deny.interaction-request';
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
   * @param logger Logger of the Authorization Server.
   * @param logoutTicketService Instance of the Logout Ticket Service.
   * @param sessionService Instance of the Session Service.
   * @param logoutTypes Logout Types registered at the Authorization Server.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    @Inject(LOGOUT_TICKET_SERVICE) private readonly logoutTicketService: LogoutTicketServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @InjectAll(LOGOUT_TYPE) private readonly logoutTypes: LogoutTypeInterface[],
    @InjectAll(INTERACTION_TYPE) protected override readonly interactionTypes: InteractionTypeInterface[],
  ) {
    super(logger, interactionTypes);
  }

  /**
   * Validates the Http Context Interaction Request and returns the actors of the Context Interaction Context.
   *
   * @param request Http Request.
   * @returns Context Interaction Context.
   */
  public override async validateContext(request: HttpRequest): Promise<LogoutContextInteractionContext> {
    this.logger.debug(`[${this.constructor.name}] Called validateContext()`, '9ce28c6c-c471-4df7-8226-d1f1f918deac', {
      request,
    });

    const context = await super.validateContext(request);

    const { parameters } = context;

    const logoutTicket = await this.getLogoutTicket(parameters);

    Object.assign<LogoutContextInteractionContext, Partial<LogoutContextInteractionContext>>(context, { logoutTicket });

    this.logger.debug(
      `[${this.constructor.name}] Logout Interaction Request Context validation completed`,
      'eb2adb81-e4bd-4f68-8249-787902b26f91',
      { context },
    );

    return context;
  }

  /**
   * Validates the Http Decision Interaction Request and returns the actors of the Decision Interaction Context.
   *
   * @param request Http Request.
   * @returns Decision Interaction Context.
   */
  public override async validateDecision(
    request: HttpRequest,
  ): Promise<LogoutDecisionInteractionContext<LogoutDecision>> {
    this.logger.debug(`[${this.constructor.name}] Called validateDecision()`, '6c58be79-616b-459b-a8b3-4b26e464118e', {
      request,
    });

    const context = await super.validateDecision(request);

    const { parameters } = context;

    const logoutTicket = await this.getLogoutTicket(parameters);
    const decision = this.getDecision(parameters);

    Object.assign<
      LogoutDecisionInteractionContext<LogoutDecision>,
      Partial<LogoutDecisionInteractionContext<LogoutDecision>>
    >(context, { logoutTicket, decision });

    switch (decision) {
      case 'accept': {
        const session = await this.getSession(parameters as LogoutDecisionAcceptInteractionRequest);
        const logoutType = this.getLogoutType(parameters as LogoutDecisionAcceptInteractionRequest);

        Object.assign<
          LogoutDecisionInteractionContext<LogoutDecision>,
          Partial<LogoutDecisionAcceptInteractionContext>
        >(context, { session, logoutType });

        this.logger.debug(
          `[${this.constructor.name}] Logout Interaction Request Accept Decision validation completed`,
          '7030dfab-9b2a-4ceb-a02b-9a23b5e0a159',
          { context },
        );

        return context;
      }

      case 'deny': {
        const error = this.getError(parameters as LogoutDecisionDenyInteractionRequest);

        Object.assign<LogoutDecisionInteractionContext<LogoutDecision>, Partial<LogoutDecisionDenyInteractionContext>>(
          context,
          { error },
        );

        this.logger.debug(
          `[${this.constructor.name}] Logout Interaction Request Deny Decision validation completed`,
          '36f6a72a-0974-46b8-8c5c-5f9c2d926baf',
          { context },
        );

        return context;
      }
    }
  }

  /**
   * Fetches the requested Logout Ticket from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Logout Ticket based on the provided Logout Challenge.
   */
  private async getLogoutTicket(
    parameters: LogoutContextInteractionRequest | LogoutDecisionInteractionRequest,
  ): Promise<LogoutTicket> {
    this.logger.debug(`[${this.constructor.name}] Called getLogoutTicket()`, '0ede7d3c-b6f9-43cf-9ba2-2771c760ea41', {
      parameters,
    });

    if (typeof parameters.logout_challenge === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "logout_challenge".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "logout_challenge"`,
        '4115bceb-4e99-408a-a161-0c3df4f6d459',
        { parameters },
        exc,
      );

      throw exc;
    }

    const logoutTicket = await this.logoutTicketService.findOneByLogoutChallenge(parameters.logout_challenge);

    if (logoutTicket === null) {
      const exc = new AccessDeniedException('Invalid Logout Challenge.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Logout Challenge`,
        'a382ce84-aff9-4708-8008-21d4e4b94c71',
        null,
        exc,
      );

      throw exc;
    }

    return logoutTicket;
  }

  /**
   * Checks and returns the Logout Decision provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Logout Decision provided by the Client.
   */
  private getDecision(parameters: LogoutDecisionInteractionRequest): LogoutDecision {
    this.logger.debug(`[${this.constructor.name}] Called getDecision()`, 'f22d3d45-3e60-48c1-b641-4608225a11d7', {
      parameters,
    });

    if (typeof parameters.decision === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "decision".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "decision"`,
        '2ac3d6b4-4da0-4086-b5f1-56cd4a872a20',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (parameters.decision !== 'accept' && parameters.decision !== 'deny') {
      const exc = new InvalidRequestException(`Unsupported decision "${parameters.decision}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported decision "${parameters.decision}"`,
        '9267b5bf-6ac7-49d3-9357-e53a2d684086',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.decision;
  }

  /**
   * Fetches a Session from the application's storage based on the provided Session Identifier.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Session based on the provided Session Identifier.
   */
  private async getSession(parameters: LogoutDecisionAcceptInteractionRequest): Promise<Session> {
    this.logger.debug(`[${this.constructor.name}] Called getSession()`, 'b24b2fa0-ffcb-4152-9a30-b553825a29f7', {
      parameters,
    });

    if (typeof parameters.session_id === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "session_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "session_id"`,
        '04b120d1-dde8-404f-9c6d-00fa6e054ac5',
        { parameters },
        exc,
      );

      throw exc;
    }

    const session = await this.sessionService.findOne(parameters.session_id);

    if (session === null) {
      const exc = new AccessDeniedException('Invalid Session Identifier.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Session Identifier`,
        '2dc6cae1-f5f0-46ac-9698-3aef0198a2d9',
        null,
        exc,
      );

      throw exc;
    }

    return session;
  }

  /**
   * Checks and returns the Logout Type requested by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Logout Type.
   */
  private getLogoutType(parameters: LogoutDecisionAcceptInteractionRequest): LogoutTypeInterface {
    this.logger.debug(`[${this.constructor.name}] Called getLogoutType()`, '8ad7abbf-85ce-4354-b4fa-f3e00c7ad17c', {
      parameters,
    });

    if (typeof parameters.logout_type === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "logout_type".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "logout_type"`,
        '5a275d66-e29c-4114-9c4d-9d4be018e78e',
        { parameters },
        exc,
      );

      throw exc;
    }

    const logoutType = this.logoutTypes.find((logoutType) => logoutType.name === parameters.logout_type);

    if (typeof logoutType === 'undefined') {
      const exc = new InvalidRequestException(`Unsupported logout_type "${parameters.logout_type}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported logout_type "${parameters.logout_type}"`,
        '79049311-6958-4c94-8211-da5ef9ff7256',
        null,
        exc,
      );

      throw exc;
    }

    return logoutType;
  }

  /**
   * Checks and returns the Error Parameters provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Error object based on the Error Parameters provided by the Client.
   */
  private getError(parameters: LogoutDecisionDenyInteractionRequest): OAuth2Exception {
    this.logger.debug(`[${this.constructor.name}] Called getError()`, '378f918d-e77c-4c66-b0bb-cdb8ad235cf0', {
      parameters,
    });

    if (typeof parameters.error === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "error".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "error"`,
        '45751bb0-8447-4f2d-bfd9-2c394eb40dc6',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.error_description === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "error_description".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "error_description"`,
        '7a39d675-438e-4f16-b460-4943a3c0650b',
        { parameters },
        exc,
      );

      throw exc;
    }

    const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
      Reflect.construct(OAuth2Exception, [parameters.error_description]),
      { error: parameters.error },
    );

    return exception;
  }
}
