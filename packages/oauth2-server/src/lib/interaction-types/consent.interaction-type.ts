import { Inject, Injectable } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { ConsentContextInteractionRequest } from '../messages/consent-context.interaction-request';
import { ConsentContextInteractionResponse } from '../messages/consent-context.interaction-response';
import { ConsentDecisionAcceptInteractionRequest } from '../messages/consent-decision-accept.interaction-request';
import { ConsentDecisionDenyInteractionRequest } from '../messages/consent-decision-deny.interaction-request';
import { ConsentDecisionInteractionRequest } from '../messages/consent-decision.interaction-request';
import { Prompt } from '../prompts/prompt.type';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ConsentDecisionInteractionResponse } from './consent-decision.interaction-response';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

/**
 * Implementation of the **Consent** Interaction Type.
 *
 * This Interaction is used by the application to inform the authorization server of the scopes granted by the end user
 * of the current authorization process.
 *
 * The Context portion of the Interaction checks if there is a consent based on the provided **consent_challenge**.
 * It then informs the application whether or not to force the consent collection from the end user.
 *
 * The Decision portion of the Interaction will deliberate on the decision to either **accept** or **deny**
 * the requested scope based on the parameters provided by the application.
 *
 * If the consent is denied, the authorization server informs the User-Agent to redirect to the authorization server's
 * error page to display the reason of the failure. It will also delete the Grant and Consent.
 *
 * If the consent is accepted, the authorization server informs the User-Agent to redirect to the authorization endpoint
 * to continue the authorization process.
 */
@Injectable()
export class ConsentInteractionType implements InteractionTypeInterface {
  /**
   * Name of the Interaction Type.
   */
  public readonly name: InteractionType = 'consent';

  /**
   * Instantiates a new Consent Interaction Type.
   *
   * @param settings Settings of the Authorization Server.
   * @param consentService Instance of the Consent Service.
   * @param grantService Instance of the Grant Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface
  ) {}

  /**
   * Handles the Context Flow of the Consent Interaction.
   *
   * This method verifies if there is a consent registered at the authorization server.
   *
   * If no consent is found, it informs the application to display the consent screen and provides the necessary data,
   * otherwise, it informs the application that it can safely skip this process and proceed with the authorization.
   *
   * @param parameters Parameters of the Consent Context Interaction Request.
   * @returns Parameters of the Consent Context Interaction Response.
   */
  public async handleContext(parameters: ConsentContextInteractionRequest): Promise<ConsentContextInteractionResponse> {
    this.checkContextParameters(parameters);

    const grant = await this.getGrantByConsentChallenge(parameters.consent_challenge);

    await this.checkGrant(grant);

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(grant.parameters);

    url.search = searchParameters.toString();

    return removeUndefined<ConsentContextInteractionResponse>({
      skip: grant.consent != null,
      requested_scope: grant.parameters.scope,
      subject: grant.session!.user.id,
      request_url: url.href,
      login_challenge: grant.loginChallenge,
      client: grant.client,
      context: {
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        display: grant.parameters.display,
      },
    });
  }

  /**
   * Checks if the Parameters of the Consent Context Interaction Request are valid.
   *
   * @param parameters Parameters of the Consent Context Interaction Request.
   */
  private checkContextParameters(parameters: ConsentContextInteractionRequest): void {
    const { consent_challenge: consentChallenge } = parameters;

    if (typeof consentChallenge !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "consent_challenge".' });
    }
  }

  /**
   * Handles the Decision Flow of the Consent Interaction.
   *
   * This method decides whether or not to grant the requested scope to the client
   * based on the decision of the application.
   *
   * @param parameters Parameters of the Consent Decision Interaction Request.
   * @returns Parameters of the Consent Decision Interaction Response.
   */
  public async handleDecision(
    parameters: ConsentDecisionInteractionRequest
  ): Promise<ConsentDecisionInteractionResponse> {
    this.checkDecisionParameters(parameters);

    const grant = await this.getGrantByConsentChallenge(parameters.consent_challenge);

    await this.checkGrant(grant);

    switch (parameters.decision) {
      case 'accept':
        return await this.acceptConsent(<ConsentDecisionAcceptInteractionRequest>parameters, grant);

      case 'deny':
        return await this.denyConsent(<ConsentDecisionDenyInteractionRequest>parameters, grant);

      default:
        throw new InvalidRequestException({ description: `Unsupported decision "${parameters.decision}".` });
    }
  }

  /**
   * Checks if the Parameters of the Consent Decision Interaction Request are valid.
   *
   * @param parameters Parameters of the Consent Decision Interaction Request.
   */
  private checkDecisionParameters(parameters: ConsentDecisionInteractionRequest): void {
    const { consent_challenge: consentChallenge, decision } = parameters;

    if (typeof consentChallenge !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "consent_challenge".' });
    }

    if (typeof decision !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "decision".' });
    }
  }

  /**
   * Accepts the consent performed by the application and redirects the User-Agent to continue the Authorization Process.
   *
   * @param parameters Parameters of the Consent Accept Decision Interaction Request.
   * @param grant Grant of the Consent Interaction.
   * @returns Redirect Url for the User-Agent to continue the Authorization Process.
   */
  private async acceptConsent(
    parameters: ConsentDecisionAcceptInteractionRequest,
    grant: Grant
  ): Promise<ConsentDecisionInteractionResponse> {
    this.checkAcceptDecisionParameters(parameters);

    if (grant.consent == null) {
      const grantedScopes = parameters.grant_scope.split(' ');

      this.checkGrantedScopes(grant, grantedScopes);

      const { client, session } = grant;

      if (session == null) {
        throw new AccessDeniedException({ description: 'No active session found for this consent.' });
      }

      const consent = await this.consentService.create(grantedScopes, client, session.user);

      grant.consent = consent;

      await this.grantService.save(grant);
    }

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(grant.parameters);

    url.search = searchParameters.toString();

    return { redirect_to: url.href };
  }

  /**
   * Checks if the Parameters of the Consent Accept Decision Interaction Request are valid.
   *
   * @param parameters Parameters of the Consent Accept Decision Interaction Request.
   */
  private checkAcceptDecisionParameters(parameters: ConsentDecisionAcceptInteractionRequest): void {
    const { grant_scope: grantScope } = parameters;

    if (typeof grantScope !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "grant_scope".' });
    }
  }

  /**
   * Checks if the scopes granted by the End User are valid.
   *
   * @param grant Grant being checked.
   * @param grantedScopes Scopes granted by the End User.
   */
  private checkGrantedScopes(grant: Grant, grantedScopes: string[]): void {
    const requestedScopes = grant.parameters.scope.split(' ');

    if (grantedScopes.some((grantedScope) => !requestedScopes.includes(grantedScope))) {
      throw new InvalidScopeException({ description: 'The granted scope was not requested by the Client.' });
    }
  }

  /**
   * Denies the consent performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param parameters Parameters of the Consent Deny Decision Interaction Request.
   * @param grant Grant of the Consent Interaction.
   * @returns Redirect Url for the User-Agent to abort the Authorization Process.
   */
  private async denyConsent(
    parameters: ConsentDecisionDenyInteractionRequest,
    grant: Grant
  ): Promise<ConsentDecisionInteractionResponse> {
    this.checkDenyDecisionParameters(parameters);

    await this.grantService.remove(grant);

    const { error, error_description: errorDescription } = parameters;

    const url = new URL('/oauth/error', this.settings.issuer);
    const searchParameters = new URLSearchParams({ error, error_description: errorDescription });

    url.search = searchParameters.toString();

    return { redirect_to: url.href };
  }

  /**
   * Checks if the Parameters of the Consent Deny Decision Interaction Request are valid.
   *
   * @param parameters Parameters of the Consent Deny Decision Interaction Request.
   */
  private checkDenyDecisionParameters(parameters: ConsentDecisionDenyInteractionRequest): void {
    const { error, error_description: errorDescription } = parameters;

    if (typeof error !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "error".' });
    }

    if (typeof errorDescription !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "error_description".' });
    }
  }

  /**
   * Fetches the requested Grant from the application's storage.
   *
   * @param consentChallenge Consent Challenge of the Grant provided by the Client.
   * @returns Grant based on the provided Consent Challenge.
   */
  private async getGrantByConsentChallenge(consentChallenge: string): Promise<Grant> {
    const consent = await this.grantService.findOneByConsentChallenge(consentChallenge);

    if (consent === null) {
      throw new AccessDeniedException({ description: 'Invalid Consent Challenge.' });
    }

    return consent;
  }

  /**
   * Checks the validity of the Grant.
   *
   * @param grant Grant to be checked.
   */
  private async checkGrant(grant: Grant): Promise<void> {
    try {
      if (new Date() > grant.expiresAt) {
        throw new AccessDeniedException({ description: 'Expired Grant.' });
      }
    } catch (exc: unknown) {
      await this.grantService.remove(grant);
      throw exc;
    }
  }
}
