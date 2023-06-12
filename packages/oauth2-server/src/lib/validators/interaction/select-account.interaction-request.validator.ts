import { URLSearchParams } from 'url';

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
   * @param sessionService Instance of the Session Service.
   * @param grantService Instance of the Grant Service.
   * @param loginService Instance of the Login Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface,
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
  public override async validateContext(request: HttpRequest): Promise<SelectAccountContextInteractionContext> {
    const context = await super.validateContext(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const session = await this.getSession(parameters);

    return { ...context, grant, session };
  }

  /**
   * Validates the Http Decision Interaction Request and returns the actors of the Decision Interaction Context.
   *
   * @param request Http Request.
   * @returns Decision Interaction Context.
   */
  public override async validateDecision(request: HttpRequest): Promise<SelectAccountDecisionInteractionContext> {
    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const login = await this.getLogin(parameters);

    return { ...context, grant, login };
  }

  /**
   * Fetches a Session based on the Identifier provided by the Client..
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Session based on the Identifier provided by the Client.
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
   * Fetches the requested Grant from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Grant based on the provided Login Challenge.
   */
  private async getGrant(parameters: URLSearchParams): Promise<Grant> {
    const loginChallenge = parameters.get('login_challenge');

    if (loginChallenge === null) {
      throw new InvalidRequestException('Invalid parameter "login_challenge".');
    }

    const grant = await this.grantService.findOneByLoginChallenge(loginChallenge);

    if (grant === null) {
      throw new AccessDeniedException('Invalid Login Challenge.');
    }

    return grant;
  }

  /**
   * Fetches the requested Login from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Login based on the provided Identifier.
   */
  private async getLogin(parameters: URLSearchParams): Promise<Login> {
    const loginId = parameters.get('login_id');

    if (loginId === null) {
      throw new InvalidRequestException('Invalid parameter "login_id".');
    }

    const login = await this.loginService.findOne(loginId);

    if (login === null) {
      throw new AccessDeniedException('Invalid Login Identifier.');
    }

    return login;
  }
}
