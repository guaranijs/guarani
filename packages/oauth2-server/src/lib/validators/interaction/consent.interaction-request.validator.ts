import { Inject, Injectable, InjectAll } from '@guarani/di';

import { ConsentContextInteractionContext } from '../../context/interaction/consent-context.interaction-context';
import { ConsentDecisionInteractionContext } from '../../context/interaction/consent-decision.interaction-context';
import { ConsentDecisionAcceptInteractionContext } from '../../context/interaction/consent-decision-accept.interaction-context';
import { ConsentDecisionDenyInteractionContext } from '../../context/interaction/consent-decision-deny.interaction-context';
import { Grant } from '../../entities/grant.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { ConsentDecision } from '../../interaction-types/consent-decision.type';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { Logger } from '../../logger/logger';
import { ConsentContextInteractionRequest } from '../../requests/interaction/consent-context.interaction-request';
import { ConsentDecisionInteractionRequest } from '../../requests/interaction/consent-decision.interaction-request';
import { ConsentDecisionAcceptInteractionRequest } from '../../requests/interaction/consent-decision-accept.interaction-request';
import { ConsentDecisionDenyInteractionRequest } from '../../requests/interaction/consent-decision-deny.interaction-request';
import { GrantServiceInterface } from '../../services/grant.service.interface';
import { GRANT_SERVICE } from '../../services/grant.service.token';
import { InteractionRequestValidator } from './interaction-request.validator';

/**
 * Implementation of the Consent Interaction Request Validator.
 */
@Injectable()
export class ConsentInteractionRequestValidator extends InteractionRequestValidator<
  ConsentContextInteractionContext,
  ConsentDecisionInteractionContext<ConsentDecision>
> {
  /**
   * Name of the Interaction Type that uses this Validator.
   */
  public readonly name: InteractionType = 'consent';

  /**
   * Instantiates a new Consent Interaction Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param scopeHandler Instance of the Scope Handler.
   * @param grantService Instance of the Grant Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    private readonly scopeHandler: ScopeHandler,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
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
  public override async validateContext(request: HttpRequest): Promise<ConsentContextInteractionContext> {
    this.logger.debug(`[${this.constructor.name}] Called validateContext()`, '32058e53-753a-4eb3-90d1-4d3507455cf5', {
      request,
    });

    const context = await super.validateContext(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);

    Object.assign<ConsentContextInteractionContext, Partial<ConsentContextInteractionContext>>(context, { grant });

    this.logger.debug(
      `[${this.constructor.name}] Consent Interaction Request Context validation completed`,
      '65c6b2a9-137c-489d-b9c2-7732627aebf0',
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
  ): Promise<ConsentDecisionInteractionContext<ConsentDecision>> {
    this.logger.debug(`[${this.constructor.name}] Called validateDecision()`, '322126e9-8090-4ff2-9dab-dffdfa8563cb', {
      request,
    });

    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const decision = this.getDecision(parameters);

    Object.assign<
      ConsentDecisionInteractionContext<ConsentDecision>,
      Partial<ConsentDecisionInteractionContext<ConsentDecision>>
    >(context, { grant, decision });

    switch (decision) {
      case 'accept': {
        const grantedScopes = this.getGrantedScopes(parameters as ConsentDecisionAcceptInteractionRequest, grant);

        Object.assign<
          ConsentDecisionInteractionContext<ConsentDecision>,
          Partial<ConsentDecisionAcceptInteractionContext>
        >(context, { grantedScopes });

        this.logger.debug(
          `[${this.constructor.name}] Consent Interaction Request Accept Decision validation completed`,
          'cbc4a6db-8159-49b8-85a2-f4ab9ed68367',
          { context },
        );

        return context;
      }

      case 'deny': {
        const error = this.getError(parameters as ConsentDecisionDenyInteractionRequest);

        Object.assign<
          ConsentDecisionInteractionContext<ConsentDecision>,
          Partial<ConsentDecisionDenyInteractionContext>
        >(context, { error });

        this.logger.debug(
          `[${this.constructor.name}] Consent Interaction Request Deny Decision validation completed`,
          'ef653c69-6ca4-4366-b629-44e082dcf091',
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
   * @returns Grant based on the provided Consent Challenge.
   */
  private async getGrant(
    parameters: ConsentContextInteractionRequest | ConsentDecisionInteractionRequest,
  ): Promise<Grant> {
    this.logger.debug(`[${this.constructor.name}] Called getGrant()`, 'd96a5e4b-6a14-4367-8e7a-82be6c8a57a9', {
      parameters,
    });

    if (typeof parameters.consent_challenge === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "consent_challenge".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "consent_challenge"`,
        'e93cd171-debc-480c-a17b-92da2cfe263d',
        { parameters },
        exc,
      );

      throw exc;
    }

    const grant = await this.grantService.findOneByConsentChallenge(parameters.consent_challenge);

    if (grant === null) {
      const exc = new AccessDeniedException('Invalid Consent Challenge.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Consent Challenge`,
        '4e7a0b47-797e-4e8f-a716-10923b9b70c0',
        null,
        exc,
      );

      throw exc;
    }

    return grant;
  }

  /**
   * Checks and returns the Consent Decision provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Consent Decision provided by the Client.
   */
  private getDecision(parameters: ConsentDecisionInteractionRequest): ConsentDecision {
    this.logger.debug(`[${this.constructor.name}] Called getDecision()`, 'cc44c147-4b8c-4bf9-b926-a2e9223c2840', {
      parameters,
    });

    if (typeof parameters.decision === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "decision".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "decision"`,
        '2958a9e8-2244-4121-92b2-e8f5e3d867d9',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (parameters.decision !== 'accept' && parameters.decision !== 'deny') {
      const exc = new InvalidRequestException(`Unsupported decision "${parameters.decision}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported decision "${parameters.decision}"`,
        'ce5998f9-46da-4e44-9c21-9cfb77c3502e',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.decision;
  }

  /**
   * Checks and returns the scopes granted by the End User.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Scopes grated by the End User.
   */
  private getGrantedScopes(parameters: ConsentDecisionAcceptInteractionRequest, grant: Grant): string[] {
    this.logger.debug(`[${this.constructor.name}] Called getGrantedScopes()`, '0090a107-902f-4667-84a7-b79c6dc2cd2d', {
      parameters,
    });

    if (typeof parameters.grant_scope === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "grant_scope".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "grant_scope"`,
        '9e47d7de-1242-40e2-9f72-102e2ebdb507',
        { parameters },
        exc,
      );

      throw exc;
    }

    this.scopeHandler.checkRequestedScope(parameters.grant_scope);

    const requestedScopes = grant.parameters.scope.split(' ');
    const grantedScopes = parameters.grant_scope.split(' ');

    grantedScopes.forEach((grantedScope) => {
      if (!requestedScopes.includes(grantedScope)) {
        const exc = new AccessDeniedException(`The scope "${grantedScope}" was not requested by the Client.`);

        this.logger.error(
          `[${this.constructor.name}] The scope "${grantedScope}" was not requested by the Client`,
          '37aed28e-2f3b-4b24-8cb1-1438cc647cd5',
          { requested_scopes: requestedScopes, granted_scopes: grantedScopes },
          exc,
        );

        throw exc;
      }
    });

    return grantedScopes;
  }

  /**
   * Checks and returns the Error Parameters provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Error object based on the Error Parameters provided by the Client.
   */
  private getError(parameters: ConsentDecisionDenyInteractionRequest): OAuth2Exception {
    this.logger.debug(`[${this.constructor.name}] Called getError()`, '81e397d8-934e-4b85-bf41-aca4cfeac41e', {
      parameters,
    });

    if (typeof parameters.error === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "error".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "error"`,
        '735f8d04-b1f7-4425-86b3-02566a142fb8',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.error_description === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "error_description".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "error_description"`,
        'eca7594f-d588-4bff-9c92-37dd2aed6870',
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
