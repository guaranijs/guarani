import { Inject, Injectable, InjectAll } from '@guarani/di';

import { SelectAccountContextInteractionContext } from '../../context/interaction/select-account-context.interaction-context';
import { SelectAccountDecisionInteractionContext } from '../../context/interaction/select-account-decision.interaction-context';
import { Grant } from '../../entities/grant.entity';
import { Login } from '../../entities/login.entity';
import { Session } from '../../entities/session.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { Logger } from '../../logger/logger';
import { SelectAccountContextInteractionRequest } from '../../requests/interaction/select-account-context.interaction-request';
import { SelectAccountDecisionInteractionRequest } from '../../requests/interaction/select-account-decision.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { LoginServiceInterface } from '../../services/login.service.interface';
import { LOGIN_SERVICE } from '../../services/login.service.token';
import { SessionServiceInterface } from '../../services/session.service.interface';
import { SESSION_SERVICE } from '../../services/session.service.token';
import { InteractionRequestValidator } from './interaction-request.validator';

/**
 * Implementation of the Select Account Interaction Request Validator.
 */
@Injectable()
export class SelectAccountInteractionRequestValidator extends InteractionRequestValidator<
  SelectAccountContextInteractionContext,
  SelectAccountDecisionInteractionContext
> {
  /**
   * Name of the Interaction Type that uses this Validator.
   */
  public readonly name: InteractionType = 'select_account';

  /**
   * Instantiates a new Select Account Interaction Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param sessionService Instance of the Session Service.
   * @param grantService Instance of the Grant Service.
   * @param loginService Instance of the Login Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface,
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
  public override async validateContext(request: HttpRequest): Promise<SelectAccountContextInteractionContext> {
    this.logger.debug(`[${this.constructor.name}] Called validateContext()`, 'a1168d41-8f8f-4f6b-abea-25b87537ebfc', {
      request,
    });

    const context = await super.validateContext(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const session = await this.getSession(parameters);

    Object.assign<SelectAccountContextInteractionContext, Partial<SelectAccountContextInteractionContext>>(context, {
      grant,
      session,
    });

    this.logger.debug(
      `[${this.constructor.name}] Select Account Interaction Request Context validation completed`,
      '00247fda-610a-4001-93cb-877f8e6ea5fe',
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
  public override async validateDecision(request: HttpRequest): Promise<SelectAccountDecisionInteractionContext> {
    this.logger.debug(`[${this.constructor.name}] Called validateDecision()`, 'c512cb42-83ad-42e1-a42d-e8fad5c0fe25', {
      request,
    });

    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const login = await this.getLogin(parameters);

    Object.assign<SelectAccountDecisionInteractionContext, Partial<SelectAccountDecisionInteractionContext>>(context, {
      grant,
      login,
    });

    this.logger.debug(
      `[${this.constructor.name}] Select Account Interaction Request Decision validation completed`,
      'a0c2023d-01a5-47fe-98ff-e49f8adbaeb5',
      { context },
    );

    return context;
  }

  /**
   * Fetches the requested Grant from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Grant based on the provided Login Challenge.
   */
  private async getGrant(
    parameters: SelectAccountContextInteractionRequest | SelectAccountDecisionInteractionRequest,
  ): Promise<Grant> {
    this.logger.debug(`[${this.constructor.name}] Called getGrant()`, 'ddeb2510-68f5-4746-919e-314aedb239e7', {
      parameters,
    });

    if (typeof parameters.login_challenge === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "login_challenge".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "login_challenge"`,
        '96f5ce1f-eb34-4734-a198-17719f882336',
        { parameters },
        exc,
      );

      throw exc;
    }

    const grant = await this.grantService.findOneByLoginChallenge(parameters.login_challenge);

    if (grant === null) {
      const exc = new AccessDeniedException('Invalid Login Challenge.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Login Challenge`,
        'b664b716-68a0-40ca-9e56-d54e3c984a6d',
        null,
        exc,
      );

      throw exc;
    }

    return grant;
  }

  /**
   * Fetches a Session based on the Identifier provided by the Client..
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Session based on the Identifier provided by the Client.
   */
  private async getSession(parameters: SelectAccountContextInteractionRequest): Promise<Session> {
    this.logger.debug(`[${this.constructor.name}] Called getSession()`, '21a57026-f5d5-4695-9384-92bc1ba98933', {
      parameters,
    });

    if (typeof parameters.session_id === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "session_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "session_id"`,
        '99483d75-4d0e-4294-824d-0643081108ca',
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
        'c3a3d380-6831-4210-87bd-dec570e8ed14',
        null,
        exc,
      );

      throw exc;
    }

    return session;
  }

  /**
   * Fetches the requested Login from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Login based on the provided Identifier.
   */
  private async getLogin(parameters: SelectAccountDecisionInteractionRequest): Promise<Login> {
    this.logger.debug(`[${this.constructor.name}] Called getLogin()`, 'f4921ee4-9363-4e7f-8845-3c05dc715a1d', {
      parameters,
    });

    if (typeof parameters.login_id === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "login_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "login_id"`,
        '8e880ded-283c-4e10-9b7f-bdd274530ae9',
        { parameters },
        exc,
      );

      throw exc;
    }

    const login = await this.loginService.findOne(parameters.login_id);

    if (login === null) {
      const exc = new AccessDeniedException('Invalid Login Identifier.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Login Identifier`,
        '9be0a21e-aa0e-4d97-ac99-ef6cc696e4bc',
        null,
        exc,
      );

      throw exc;
    }

    return login;
  }
}
