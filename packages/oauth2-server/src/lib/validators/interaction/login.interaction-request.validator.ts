import { URLSearchParams } from 'url';

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
    const context = await super.validateContext(request);

    const { parameters } = context;

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
    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const decision = this.getDecision(parameters);

    Object.assign(context, { grant, decision });

    switch (decision) {
      case 'accept': {
        const user = await this.getUser(parameters, grant.client);
        const amr = this.getAuthenticationMethods(parameters);
        const acr = this.getAuthenticationContextClass(parameters);

        return <LoginDecisionAcceptInteractionContext>{ ...context, user, amr, acr };
      }

      case 'deny': {
        const error = this.getError(parameters);
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
   * Checks and returns the Login Decision provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Login Decision provided by the Client.
   */
  private getDecision(parameters: URLSearchParams): LoginDecision {
    const decision = parameters.get('decision');

    if (decision === null) {
      throw new InvalidRequestException('Invalid parameter "decision".');
    }

    if (decision !== 'accept' && decision !== 'deny') {
      throw new InvalidRequestException(`Unsupported decision "${decision}".`);
    }

    return decision as LoginDecision;
  }

  /**
   * Fetches a User from the application's storage based on the provided Subject Identifier.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns User based on the provided Subject Identifier.
   */
  private async getUser(parameters: URLSearchParams, client: Client): Promise<User> {
    const subject = parameters.get('subject');

    if (subject === null) {
      throw new InvalidRequestException('Invalid parameter "subject".');
    }

    const user = await this.userService.findOne(retrieveSubjectIdentifier(subject, client, this.settings));

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
  private getAuthenticationMethods(parameters: URLSearchParams): string[] {
    return parameters.get('amr')?.split(' ') ?? [];
  }

  /**
   * Checks and returns the Authentication Context Class provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Authentication Context Class provided by the Client.
   */
  private getAuthenticationContextClass(parameters: URLSearchParams): Nullable<string> {
    return parameters.get('acr');
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
