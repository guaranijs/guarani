import { Inject, Injectable, InjectAll } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { LoginContextInteractionContext } from '../../context/interaction/login-context.interaction-context';
import { LoginDecisionInteractionContext } from '../../context/interaction/login-decision.interaction-context';
import { LoginDecisionAcceptInteractionContext } from '../../context/interaction/login-decision-accept.interaction-context';
import { LoginDecisionDenyInteractionContext } from '../../context/interaction/login-decision-deny.interaction-context';
import { Client } from '../../entities/client.entity';
import { Grant } from '../../entities/grant.entity';
import { User } from '../../entities/user.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { LoginDecision } from '../../interaction-types/login-decision.type';
import { LoginContextInteractionRequest } from '../../requests/interaction/login-context.interaction-request';
import { LoginDecisionInteractionRequest } from '../../requests/interaction/login-decision.interaction-request';
import { LoginDecisionAcceptInteractionRequest } from '../../requests/interaction/login-decision-accept.interaction-request';
import { LoginDecisionDenyInteractionRequest } from '../../requests/interaction/login-decision-deny.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { UserServiceInterface } from '../../services/user.service.interface';
import { USER_SERVICE } from '../../services/user.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { retrieveSubjectIdentifier } from '../../utils/retrieve-subject-identifier';
import { InteractionRequestValidator } from './interaction-request.validator';

/**
 * Implementation of the Login Interaction Request Validator.
 */
@Injectable()
export class LoginInteractionRequestValidator extends InteractionRequestValidator<
  LoginContextInteractionContext,
  LoginDecisionInteractionContext<LoginDecision>
> {
  /**
   * Name of the Interaction Type that uses this Validator.
   */
  public readonly name: InteractionType = 'login';

  /**
   * Instantiates a new Login Interaction Request Validator.
   *
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param userService Instance of the User Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    @Inject(SETTINGS) protected readonly settings: Settings,
    @Inject(GRANT_SERVICE) protected readonly grantService: GrantServiceInterface,
    @Inject(USER_SERVICE) protected readonly userService: UserServiceInterface,
    @InjectAll(INTERACTION_TYPE) protected override readonly interactionTypes: InteractionTypeInterface[],
  ) {
    super(interactionTypes);
  }

  /**
   * Validates the Http Context Interaction Request and returns the actors of the Context Interaction Context.
   *
   * @param request Http Request.
   * @returns Context Interaction Context.
   */
  public override async validateContext(request: HttpRequest): Promise<LoginContextInteractionContext> {
    const context = await super.validateContext(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);

    return Object.assign(context, { grant }) as LoginContextInteractionContext;
  }

  /**
   * Validates the Http Decision Interaction Request and returns the actors of the Decision Interaction Context.
   *
   * @param request Http Request.
   * @returns Decision Interaction Context.
   */
  public override async validateDecision(
    request: HttpRequest,
  ): Promise<LoginDecisionInteractionContext<LoginDecision>> {
    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const decision = this.getDecision(parameters);

    Object.assign(context, { grant, decision });

    switch (decision) {
      case 'accept': {
        const user = await this.getUser(parameters as LoginDecisionAcceptInteractionRequest, grant.client);
        const amr = this.getAuthenticationMethods(parameters as LoginDecisionAcceptInteractionRequest);
        const acr = this.getAuthenticationContextClass(parameters as LoginDecisionAcceptInteractionRequest);

        return Object.assign(context, { user, amr, acr }) as LoginDecisionAcceptInteractionContext;
      }

      case 'deny': {
        const error = this.getError(parameters as LoginDecisionDenyInteractionRequest);
        return Object.assign(context, { error }) as LoginDecisionDenyInteractionContext;
      }
    }
  }

  /**
   * Fetches the requested Grant from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Grant based on the provided Login Challenge.
   */
  private async getGrant(parameters: LoginContextInteractionRequest | LoginDecisionInteractionRequest): Promise<Grant> {
    if (typeof parameters.login_challenge === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "login_challenge".');
    }

    const grant = await this.grantService.findOneByLoginChallenge(parameters.login_challenge);

    if (grant === null) {
      throw new AccessDeniedException('Invalid Login Challenge.');
    }

    return grant;
  }

  /**
   * Checks and returns the Login Decision provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Login Decision provided by the Client.
   */
  private getDecision(parameters: LoginDecisionInteractionRequest): LoginDecision {
    if (typeof parameters.decision === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "decision".');
    }

    if (parameters.decision !== 'accept' && parameters.decision !== 'deny') {
      throw new InvalidRequestException(`Unsupported decision "${parameters.decision}".`);
    }

    return parameters.decision;
  }

  /**
   * Fetches a User from the application's storage based on the provided Subject Identifier.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns User based on the provided Subject Identifier.
   */
  private async getUser(parameters: LoginDecisionAcceptInteractionRequest, client: Client): Promise<User> {
    if (typeof parameters.subject === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "subject".');
    }

    const user = await this.userService.findOne(retrieveSubjectIdentifier(parameters.subject, client, this.settings));

    if (user === null) {
      throw new AccessDeniedException('Invalid User.');
    }

    return user;
  }

  /**
   * Checks and returns the Authentication Methods provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Authentication Methods provided by the Client.
   */
  private getAuthenticationMethods(parameters: LoginDecisionAcceptInteractionRequest): Nullable<string[]> {
    return parameters.amr?.split(' ') ?? null;
  }

  /**
   * Checks and returns the Authentication Context Class provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Authentication Context Class provided by the Client.
   */
  private getAuthenticationContextClass(parameters: LoginDecisionAcceptInteractionRequest): Nullable<string> {
    return parameters.acr ?? null;
  }

  /**
   * Checks and returns the Error Parameters provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Error object based on the Error Parameters provided by the Client.
   */
  private getError(parameters: LoginDecisionDenyInteractionRequest): OAuth2Exception {
    if (typeof parameters.error === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "error".');
    }

    if (typeof parameters.error_description === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "error_description".');
    }

    const exception: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
      Reflect.construct(OAuth2Exception, [parameters.error_description]),
      { error: parameters.error },
    );

    return exception;
  }
}
