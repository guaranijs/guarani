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
import { Logger } from '../../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param userService Instance of the User Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    @Inject(SETTINGS) protected readonly settings: Settings,
    @Inject(GRANT_SERVICE) protected readonly grantService: GrantServiceInterface,
    @Inject(USER_SERVICE) protected readonly userService: UserServiceInterface,
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
  public override async validateContext(request: HttpRequest): Promise<LoginContextInteractionContext> {
    this.logger.debug(`[${this.constructor.name}] Called validateContext()`, 'ef97fe47-3da8-4c6a-8a2e-044e5aefe326', {
      request,
    });

    const context = await super.validateContext(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);

    Object.assign<LoginContextInteractionContext, Partial<LoginContextInteractionContext>>(context, { grant });

    this.logger.debug(
      `[${this.constructor.name}] Login Interaction Request Context validation completed`,
      '22dfa0e8-2318-4f8c-93c7-eaea59e69cfd',
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
  ): Promise<LoginDecisionInteractionContext<LoginDecision>> {
    this.logger.debug(`[${this.constructor.name}] Called validateDecision()`, 'ec252e10-2f81-4695-9176-193679037c6b', {
      request,
    });

    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const decision = this.getDecision(parameters);

    Object.assign<
      LoginDecisionInteractionContext<LoginDecision>,
      Partial<LoginDecisionInteractionContext<LoginDecision>>
    >(context, { grant, decision });

    switch (decision) {
      case 'accept': {
        const user = await this.getUser(parameters as LoginDecisionAcceptInteractionRequest, grant.client);
        const amr = this.getAuthenticationMethods(parameters as LoginDecisionAcceptInteractionRequest);
        const acr = this.getAuthenticationContextClass(parameters as LoginDecisionAcceptInteractionRequest);

        Object.assign<LoginDecisionInteractionContext<LoginDecision>, Partial<LoginDecisionAcceptInteractionContext>>(
          context,
          { user, amr, acr },
        );

        this.logger.debug(
          `[${this.constructor.name}] Login Interaction Request Accept Decision validation completed`,
          '2bab0b5b-6687-42fa-bd41-c823f1544eb6',
          { context },
        );

        return context;
      }

      case 'deny': {
        const error = this.getError(parameters as LoginDecisionDenyInteractionRequest);

        Object.assign<LoginDecisionInteractionContext<LoginDecision>, Partial<LoginDecisionDenyInteractionContext>>(
          context,
          { error },
        );

        this.logger.debug(
          `[${this.constructor.name}] Login Interaction Request Deny Decision validation completed`,
          '36b6f811-20ca-43c0-92ef-98af6004b72b',
          { context },
        );

        return context;
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
    this.logger.debug(`[${this.constructor.name}] Called getGrant()`, 'd5ab6f2e-2bc8-4332-b47f-7c2657ec192c', {
      parameters,
    });

    if (typeof parameters.login_challenge === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "login_challenge".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "login_challenge"`,
        '2cbeb1a7-4a4e-4430-abf4-e9c6c3d47a29',
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
        '0d114234-0f28-460e-ae01-de9a03986f18',
        null,
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getDecision()`, 'db7bad2c-309f-425f-a88c-2092ad56f28b', {
      parameters,
    });

    if (typeof parameters.decision === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "decision".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "decision"`,
        '45c0b356-f0c4-407d-98e7-d9d2140e2b21',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (parameters.decision !== 'accept' && parameters.decision !== 'deny') {
      const exc = new InvalidRequestException(`Unsupported decision "${parameters.decision}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported decision "${parameters.decision}"`,
        '408b8c58-61d8-439f-9aa7-7d11e2590635',
        { parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getUser()`, '9711a8ff-91f5-4668-955d-07a2c8de7b81', {
      parameters,
    });

    if (typeof parameters.subject === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "subject".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "subject"`,
        '6ca68f17-282c-49f0-ba8e-72b19e27791e',
        { parameters },
        exc,
      );

      throw exc;
    }

    const user = await this.userService.findOne(retrieveSubjectIdentifier(parameters.subject, client, this.settings));

    if (user === null) {
      const exc = new AccessDeniedException('Invalid User.');
      this.logger.error(`[${this.constructor.name}] Invalid User`, '54ee3b7e-1e91-49df-a9d7-a2c5cb767e55', null, exc);
      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called getAuthenticationMethods()`,
      'bd61afe3-4589-4073-9643-fa090a7ce54e',
      { parameters },
    );

    return parameters.amr?.split(' ') ?? null;
  }

  /**
   * Checks and returns the Authentication Context Class provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Authentication Context Class provided by the Client.
   */
  private getAuthenticationContextClass(parameters: LoginDecisionAcceptInteractionRequest): Nullable<string> {
    this.logger.debug(
      `[${this.constructor.name}] Called getAuthenticationContextClass()`,
      '5d579dc9-9b6d-4f0b-9568-2efa8654f1d5',
      { parameters },
    );

    return parameters.acr ?? null;
  }

  /**
   * Checks and returns the Error Parameters provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Error object based on the Error Parameters provided by the Client.
   */
  private getError(parameters: LoginDecisionDenyInteractionRequest): OAuth2Exception {
    this.logger.debug(`[${this.constructor.name}] Called getError()`, 'e7b7b895-1de8-4ce1-8ca3-315b4118ce18', {
      parameters,
    });

    if (typeof parameters.error === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "error".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "error"`,
        '175ffdb6-cdda-480d-8523-8e211f399b6a',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.error_description === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "error_description".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "error_description"`,
        '575214ec-e871-487a-9e2b-7b2c71450d1c',
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
