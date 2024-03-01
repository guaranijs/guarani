import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';

import { ConsentContextInteractionContext } from '../context/interaction/consent-context.interaction-context';
import { ConsentDecisionInteractionContext } from '../context/interaction/consent-decision.interaction-context';
import { ConsentDecisionAcceptInteractionContext } from '../context/interaction/consent-decision-accept.interaction-context';
import { ConsentDecisionDenyInteractionContext } from '../context/interaction/consent-decision-deny.interaction-context';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AccountSelectionRequiredException } from '../exceptions/account-selection-required.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { Logger } from '../logger/logger';
import { ConsentContextInteractionResponse } from '../responses/interaction/consent-context.interaction-response';
import { ConsentDecisionInteractionResponse } from '../responses/interaction/consent-decision.interaction-response';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Prompt } from '../types/prompt.type';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { calculateSubjectIdentifier } from '../utils/calculate-subject-identifier';
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
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param sessionService Instance of the Session Service.
   * @param loginService Instance of the Login Service.
   * @param consentService Instance of the Consent Service.
   * @param grantService Instance of the Grant Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
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
   * @returns Consent Context Interaction Response.
   */
  public async handleContext(context: ConsentContextInteractionContext): Promise<ConsentContextInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleContext()`, '97ebd06e-3e84-4bf7-8555-2ba8690b66fe', {
      context,
    });

    const { grant } = context;

    await this.checkGrant(grant);

    const url = addParametersToUrl(new URL('/oauth/authorize', this.settings.issuer), grant.parameters);

    const response: ConsentContextInteractionResponse = {
      skip: grant.consent !== null,
      requested_scope: grant.parameters.scope,
      subject: calculateSubjectIdentifier(grant.session.activeLogin!.user, grant.client, this.settings),
      request_url: url.href,
      login_challenge: grant.loginChallenge,
      client: grant.client.id,
      context: {
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        display: grant.parameters.display,
        ui_locales: grant.parameters.ui_locales?.split(' '),
      },
    };

    this.logger.debug(
      `[${this.constructor.name}] Consent Context Interaction completed`,
      '87150b81-b32b-4543-9a5c-1dac43334101',
      { response },
    );

    return response;
  }

  /**
   * Handles the Decision Flow of the Consent Interaction.
   *
   * This method decides whether or not to grant the requested scope to the client
   * based on the decision of the application.
   *
   * @param context Consent Decision Interaction Context.
   * @returns Consent Decision Interaction Response.
   */
  public async handleDecision(context: ConsentDecisionInteractionContext): Promise<ConsentDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleDecision()`, 'd6e31f67-127a-45d6-a00e-970888e43459', {
      context,
    });

    const { decision, grant } = context;

    await this.checkGrant(grant);

    switch (decision) {
      case 'accept': {
        const response = await this.acceptConsent(<ConsentDecisionAcceptInteractionContext>context);

        this.logger.debug(
          `[${this.constructor.name}] Consent Decision Interaction completed`,
          'd5fbc627-989e-4bc1-ae06-c68d0c901073',
          { decision, response },
        );

        return response;
      }

      case 'deny': {
        const response = await this.denyConsent(<ConsentDecisionDenyInteractionContext>context);

        this.logger.debug(
          `[${this.constructor.name}] Consent Decision Interaction completed`,
          'e3ca508f-46a7-4b28-b2cd-e28dad6a7265',
          { decision, response },
        );

        return response;
      }
    }
  }

  /**
   * Accepts the consent performed by the application and redirects the User-Agent to continue the Authorization Process.
   *
   * @param context Consent Decision Interaction Context.
   * @returns Consent Decision Interaction Response.
   */
  private async acceptConsent(
    context: ConsentDecisionAcceptInteractionContext,
  ): Promise<ConsentDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called acceptConsent()`, '31b6c66c-5090-4dcb-b260-fcce8e9ebafb', {
      context,
    });

    const { grant, grantedScopes } = context;

    if (grant.consent === null) {
      const { client, session } = grant;

      let scopes = grantedScopes;

      // TODO: Add logging for this since the OIDC Spec only requires that we ignore the scope if this happens.
      if (scopes.includes('offline_access') && !grant.parameters.response_type.includes('code')) {
        this.logger.debug(
          `[${this.constructor.name}] Removing scope "offline_access" for response_type "${grant.parameters.response_type}"`,
          '161dec91-0722-420d-917c-07235b9d7b32',
          { scopes },
        );

        scopes = scopes.filter((scope) => scope !== 'offline_access');
      }

      const activeLoginIncludesClient =
        typeof session.activeLogin!.clients.find((loginClient) => loginClient.id === client.id) !== 'undefined';

      if (!activeLoginIncludesClient) {
        this.logger.debug(
          `[${this.constructor.name}] Registering Client "${client.id}" for current Login`,
          'cc2311e0-290d-4358-b71d-448f102d05fa',
        );

        session.activeLogin!.clients.push(client);

        await this.loginService.save(session.activeLogin!);
        await this.sessionService.save(session);
      }

      const consent = await this.consentService.create(scopes, client, session.activeLogin!.user);

      grant.consent = consent;
      grant.interactions.push('consent');

      await this.grantService.save(grant);
    }

    const url = addParametersToUrl(new URL('/oauth/authorize', this.settings.issuer), grant.parameters);

    return { redirect_to: url.href };
  }

  /**
   * Denies the consent performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param context Consent Decision Interaction Context.
   * @returns Consent Decision Interaction Response.
   */
  private async denyConsent(
    context: ConsentDecisionDenyInteractionContext,
  ): Promise<ConsentDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called denyConsent()`, '9ef9096d-c166-4773-ae5e-819e0fdc8faf', {
      context,
    });

    const { grant, error } = context;

    await this.grantService.remove(grant);

    const url = addParametersToUrl(new URL('/oauth/error', this.settings.issuer), error.toJSON());

    return { redirect_to: url.href };
  }

  /**
   * Checks the validity of the Grant.
   *
   * @param grant Grant to be checked.
   */
  private async checkGrant(grant: Grant): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called checkGrant()`, '40437f26-0875-44ee-97df-1643b4fdb167', {
      grant,
    });

    if (new Date() > grant.expiresAt) {
      await this.grantService.remove(grant);

      const exc = new AccessDeniedException('Expired Grant.');

      this.logger.error(
        `[${this.constructor.name}] Expired Grant`,
        '1d989e45-c377-4915-ae7b-22adddc41868',
        { grant },
        exc,
      );

      throw exc;
    }

    if (grant.session.activeLogin === null) {
      await this.grantService.remove(grant);

      if (grant.parameters.prompt?.includes('select_account') === true) {
        const exc = new AccountSelectionRequiredException('Account selection required.');

        this.logger.error(
          `[${this.constructor.name}] Account selection required`,
          'd06c8e77-de6a-4074-ae51-cd5ce878616f',
          { grant },
          exc,
        );

        throw exc;
      }

      const exc = new LoginRequiredException('No active Login found.');

      this.logger.error(
        `[${this.constructor.name}] No active Login found`,
        'd097bc5e-98c2-4f7b-a425-ac07262f42d5',
        { grant },
        exc,
      );

      throw exc;
    }
  }
}
