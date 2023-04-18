import { Inject, Injectable } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { ConsentContextInteractionContext } from '../context/interaction/consent-context.interaction.context';
import { ConsentDecisionAcceptInteractionContext } from '../context/interaction/consent-decision-accept.interaction.context';
import { ConsentDecisionDenyInteractionContext } from '../context/interaction/consent-decision-deny.interaction.context';
import { ConsentDecisionInteractionContext } from '../context/interaction/consent-decision.interaction.context';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { Prompt } from '../prompts/prompt.type';
import { ConsentContextInteractionResponse } from '../responses/interaction/consent-context.interaction-response';
import { ConsentDecisionInteractionResponse } from '../responses/interaction/consent-decision.interaction-response';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { ConsentDecision } from './consent-decision.type';
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
   * @param context Consent Context Interaction Context.
   * @returns Parameters of the Consent Context Interaction Response.
   */
  public async handleContext(context: ConsentContextInteractionContext): Promise<ConsentContextInteractionResponse> {
    const { grant } = context;

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
      client: grant.client, // TODO: return only the client id.
      context: {
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        display: grant.parameters.display,
        ui_locales: grant.parameters.ui_locales?.split(' '),
      },
    });
  }

  /**
   * Handles the Decision Flow of the Consent Interaction.
   *
   * This method decides whether or not to grant the requested scope to the client
   * based on the decision of the application.
   *
   * @param context Consent Decision Interaction Context.
   * @returns Parameters of the Consent Decision Interaction Response.
   */
  public async handleDecision(
    context: ConsentDecisionInteractionContext<ConsentDecision>
  ): Promise<ConsentDecisionInteractionResponse> {
    const { decision, grant } = context;

    await this.checkGrant(grant);

    switch (decision) {
      case 'accept':
        return await this.acceptConsent(<ConsentDecisionAcceptInteractionContext>context);

      case 'deny':
        return await this.denyConsent(<ConsentDecisionDenyInteractionContext>context);
    }
  }

  /**
   * Accepts the consent performed by the application and redirects the User-Agent to continue the Authorization Process.
   *
   * @param context Consent Decision Interaction Context.
   * @returns Redirect Url for the User-Agent to continue the Authorization Process.
   */
  private async acceptConsent(
    context: ConsentDecisionAcceptInteractionContext
  ): Promise<ConsentDecisionInteractionResponse> {
    const { grant, grantedScopes } = context;

    if (grant.consent == null) {
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
   * Denies the consent performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param context Consent Decision Interaction Context.
   * @returns Redirect Url for the User-Agent to abort the Authorization Process.
   */
  private async denyConsent(
    context: ConsentDecisionDenyInteractionContext
  ): Promise<ConsentDecisionInteractionResponse> {
    const { grant, error } = context;

    await this.grantService.remove(grant);

    const url = new URL('/oauth/error', this.settings.issuer);
    const searchParameters = new URLSearchParams(error.toJSON());

    url.search = searchParameters.toString();

    return { redirect_to: url.href };
  }

  /**
   * Checks the validity of the Grant.
   *
   * @param grant Grant to be checked.
   */
  private async checkGrant(grant: Grant): Promise<void> {
    if (new Date() > grant.expiresAt) {
      await this.grantService.remove(grant);
      throw new AccessDeniedException({ description: 'Expired Grant.' });
    }
  }
}
