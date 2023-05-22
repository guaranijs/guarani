import { Inject, Injectable, InjectAll } from '@guarani/di';

import { LoginContextInteractionContext } from '../../context/interaction/login-context.interaction.context';
import { LoginDecisionAcceptInteractionContext } from '../../context/interaction/login-decision-accept.interaction.context';
import { LoginDecisionDenyInteractionContext } from '../../context/interaction/login-decision-deny.interaction.context';
import { LoginDecisionInteractionContext } from '../../context/interaction/login-decision.interaction.context';
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
import { LoginDecisionAcceptInteractionRequest } from '../../requests/interaction/login-decision-accept.interaction-request';
import { LoginDecisionDenyInteractionRequest } from '../../requests/interaction/login-decision-deny.interaction-request';
import { LoginDecisionInteractionRequest } from '../../requests/interaction/login-decision.interaction-request';
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
  LoginContextInteractionRequest,
  LoginContextInteractionContext,
  LoginDecisionInteractionRequest<LoginDecision>,
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
  public override async validateContext(request: HttpRequest): Promise<LoginContextInteractionContext> {
    const parameters = <LoginContextInteractionRequest>request.query;

    const context = await super.validateContext(request);

    const grant = await this.getGrant(parameters);

    return { ...context, grant };
  }

  /**
   * Validates the Http Decision Interaction Request and returns the actors of the Decision Interaction Context.
   *
   * @param request Http Request.
   * @returns Decision Interaction Context.
   */
  public override async validateDecision(
    request: HttpRequest
  ): Promise<LoginDecisionInteractionContext<LoginDecision>> {
    const parameters = <LoginDecisionInteractionRequest<LoginDecision>>request.body;

    const context = await super.validateDecision(request);

    const grant = await this.getGrant(parameters);
    const decision = this.getDecision(parameters);

    Object.assign(context, { grant, decision });

    switch (decision) {
      case 'accept': {
        const user = await this.getUser(<LoginDecisionAcceptInteractionRequest>parameters, grant.client);
        const amr = this.getAuthenticationMethods(<LoginDecisionAcceptInteractionRequest>parameters);
        const acr = this.getAuthenticationContextClass(<LoginDecisionAcceptInteractionRequest>parameters);

        return <LoginDecisionAcceptInteractionContext>{ ...context, user, amr, acr };
      }

      case 'deny': {
        const error = this.getError(<LoginDecisionDenyInteractionRequest>parameters);

        return <LoginDecisionDenyInteractionContext>{ ...context, error };
      }
    }
  }

  /**
   * Fetches the requested Grant from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Grant based on the provided Login Challenge.
   */
  private async getGrant(
    parameters: LoginContextInteractionRequest | LoginDecisionInteractionRequest<LoginDecision>
  ): Promise<Grant> {
    if (typeof parameters.login_challenge !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "login_challenge".' });
    }

    const grant = await this.grantService.findOneByLoginChallenge(parameters.login_challenge);

    if (grant === null) {
      throw new AccessDeniedException({ description: 'Invalid Login Challenge.' });
    }

    return grant;
  }

  /**
   * Checks and returns the Login Decision provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Login Decision provided by the Client.
   */
  private getDecision(parameters: LoginDecisionInteractionRequest<LoginDecision>): LoginDecision {
    if (typeof parameters.decision !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "decision".' });
    }

    if (parameters.decision !== 'accept' && parameters.decision !== 'deny') {
      throw new InvalidRequestException({ description: `Unsupported decision "${parameters.decision}".` });
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
    if (typeof parameters.subject !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "subject".' });
    }

    const user = await this.userService.findOne(retrieveSubjectIdentifier(parameters.subject, client, this.settings));

    if (user === null) {
      throw new AccessDeniedException({ description: 'Invalid User.' });
    }

    return user;
  }

  /**
   * Checks and returns the Authentication Methods provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Authentication Methods provided by the Client.
   */
  private getAuthenticationMethods(parameters: LoginDecisionAcceptInteractionRequest): string[] {
    if (parameters.amr !== undefined && typeof parameters.amr !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "amr".' });
    }

    return parameters.amr?.split(' ') ?? [];
  }

  /**
   * Checks and returns the Authentication Context Class provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Authentication Context Class provided by the Client.
   */
  private getAuthenticationContextClass(parameters: LoginDecisionAcceptInteractionRequest): string | undefined {
    if (parameters.acr !== undefined && typeof parameters.acr !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "acr".' });
    }

    return parameters.acr;
  }

  /**
   * Checks and returns the Error Parameters provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Error object based on the Error Parameters provided by the Client.
   */
  private getError(parameters: LoginDecisionDenyInteractionRequest): OAuth2Exception {
    if (typeof parameters.error !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "error".' });
    }

    if (typeof parameters.error_description !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "error_description".' });
    }

    const error: OAuth2Exception = Reflect.construct(OAuth2Exception, [{ description: parameters.error_description }]);

    Reflect.set(error, 'code', parameters.error);

    return error;
  }
}
