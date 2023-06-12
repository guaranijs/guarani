import { URLSearchParams } from 'url';

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
   * @param scopeHandler Instance of the Scope Handler.
   * @param grantService Instance of the Grant Service.
   * @param interactionTypes Interaction Types registered at the Authorization Server.
   */
  public constructor(
    protected readonly scopeHandler: ScopeHandler,
    @Inject(GRANT_SERVICE) protected readonly grantService: GrantServiceInterface,
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
  public override async validateContext(request: HttpRequest): Promise<ConsentContextInteractionContext> {
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
  ): Promise<ConsentDecisionInteractionContext<ConsentDecision>> {
    const context = await super.validateDecision(request);

    const { parameters } = context;

    const grant = await this.getGrant(parameters);
    const decision = this.getDecision(parameters);

    Object.assign(context, { grant, decision });

    switch (decision) {
      case 'accept': {
        const grantedScopes = this.getGrantedScopes(parameters, grant);
        return <ConsentDecisionAcceptInteractionContext>{ ...context, grantedScopes };
      }

      case 'deny': {
        const error = this.getError(parameters);
        return <ConsentDecisionDenyInteractionContext>{ ...context, error };
      }
    }
  }

  /**
   * Fetches the requested Grant from the application's storage.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Grant based on the provided Consent Challenge.
   */
  private async getGrant(parameters: URLSearchParams): Promise<Grant> {
    const consentChallenge = parameters.get('consent_challenge');

    if (consentChallenge === null) {
      throw new InvalidRequestException('Invalid parameter "consent_challenge".');
    }

    const grant = await this.grantService.findOneByConsentChallenge(consentChallenge);

    if (grant === null) {
      throw new AccessDeniedException('Invalid Consent Challenge.');
    }

    return grant;
  }

  /**
   * Checks and returns the Consent Decision provided by the Client.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Consent Decision provided by the Client.
   */
  private getDecision(parameters: URLSearchParams): ConsentDecision {
    const decision = parameters.get('decision');

    if (decision === null) {
      throw new InvalidRequestException('Invalid parameter "decision".');
    }

    if (decision !== 'accept' && decision !== 'deny') {
      throw new InvalidRequestException(`Unsupported decision "${decision}".`);
    }

    return decision as ConsentDecision;
  }

  /**
   * Checks and returns the scopes granted by the End User.
   *
   * @param parameters Parameters of the Interaction Request.
   * @returns Scopes grated by the End User.
   */
  private getGrantedScopes(parameters: URLSearchParams, grant: Grant): string[] {
    const grantScope = parameters.get('grant_scope');

    if (grantScope === null) {
      throw new InvalidRequestException('Invalid parameter "grant_scope".');
    }

    this.scopeHandler.checkRequestedScope(grantScope);

    const requestedScopes = grant.parameters.scope.split(' ');
    const grantedScopes = grantScope.split(' ');

    grantedScopes.forEach((grantedScope) => {
      if (!requestedScopes.includes(grantedScope)) {
        throw new AccessDeniedException(`The scope "${grantedScope}" was not requested by the Client.`);
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
