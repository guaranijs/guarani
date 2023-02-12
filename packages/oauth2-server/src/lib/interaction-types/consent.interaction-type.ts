import { Inject, Injectable } from '@guarani/di';

import { Consent } from '../entities/consent.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { ConsentContextInteractionRequest } from '../messages/consent-context.interaction-request';
import { ConsentContextInteractionResponse } from '../messages/consent-context.interaction-response';
import { ConsentDecisionAcceptInteractionRequest } from '../messages/consent-decision-accept.interaction-request';
import { ConsentDecisionDenyInteractionRequest } from '../messages/consent-decision-deny.interaction-request';
import { ConsentDecisionInteractionRequest } from '../messages/consent-decision.interaction-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
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
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface
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

    const consent = await this.getConsent(parameters.consent_challenge);

    await this.checkConsent(consent);

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(consent.parameters);

    url.search = searchParameters.toString();

    return {
      skip: consent.scopes.length !== 0,
      requested_scope: consent.parameters.scope,
      subject: consent.user.id,
      request_url: url.href,
      login_challenge: consent.session.id,
      client: consent.client,
      context: {},
    };
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

    const consent = await this.getConsent(parameters.consent_challenge);

    await this.checkConsent(consent);

    switch (parameters.decision) {
      case 'accept':
        return await this.acceptConsent(<ConsentDecisionAcceptInteractionRequest>parameters, consent);

      case 'deny':
        return await this.denyConsent(<ConsentDecisionDenyInteractionRequest>parameters, consent);

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
   * @param consent Grant of the Consent Interaction.
   * @returns Redirect Url for the User-Agent to continue the Authorization Process.
   */
  private async acceptConsent(
    parameters: ConsentDecisionAcceptInteractionRequest,
    consent: Consent
  ): Promise<ConsentDecisionInteractionResponse> {
    this.checkAcceptDecisionParameters(parameters);

    const grantedScopes = parameters.grant_scope.split(' ');

    this.checkGrantedScopes(consent, grantedScopes);

    consent.scopes = grantedScopes;

    await this.consentService.save(consent);

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(consent.parameters);

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
   * Checks if the scopes granted by the End User are valid and updates the Consent with them.
   *
   * @param consent Consent being checked.
   * @param grantedScopes Scopes granted by the End User.
   */
  private checkGrantedScopes(consent: Consent, grantedScopes: string[]): void {
    const requestedScopes = consent.parameters.scope.split(' ');

    if (grantedScopes.some((grantedScope) => !requestedScopes.includes(grantedScope))) {
      throw new InvalidScopeException({ description: 'The granted scope was not requested by the Client.' });
    }
  }

  /**
   * Denies the consent performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param parameters Parameters of the Consent Deny Decision Interaction Request.
   * @param consent Grant of the Consent Interaction.
   * @returns Redirect Url for the User-Agent to abort the Authorization Process.
   */
  private async denyConsent(
    parameters: ConsentDecisionDenyInteractionRequest,
    consent: Consent
  ): Promise<ConsentDecisionInteractionResponse> {
    this.checkDenyDecisionParameters(parameters);

    await this.consentService.remove(consent);

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
   * Fetches the requested Consent from the application's storage.
   *
   * @param id Identifier of the Consent provided by the Client.
   * @returns Consent based on the provided Identifier.
   */
  private async getConsent(id: string): Promise<Consent> {
    const consent = await this.consentService.findOne(id);

    if (consent === null) {
      throw new AccessDeniedException({ description: 'Invalid Consent.' });
    }

    return consent;
  }

  /**
   * Checks the validity of the Consent.
   *
   * @param consent Consent to be checked.
   */
  private async checkConsent(consent: Consent): Promise<void> {
    try {
      if (consent.expiresAt != null && new Date() > consent.expiresAt) {
        throw new AccessDeniedException({ description: 'Expired Consent.' });
      }
    } catch (exc: unknown) {
      await this.consentService.remove(consent);
      throw exc;
    }
  }
}
