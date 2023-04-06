import { Inject, Injectable, InjectAll } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL, URLSearchParams } from 'url';
import { isDeepStrictEqual } from 'util';

import { DisplayInterface } from '../displays/display.interface';
import { DISPLAY } from '../displays/display.token';
import { Display } from '../displays/display.type';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpResponse } from '../http/http.response';
import { PromptInterface } from '../prompts/prompt.interface';
import { PROMPT } from '../prompts/prompt.token';
import { Prompt } from '../prompts/prompt.type';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { IdTokenHandler } from './id-token.handler';

/**
 * Handler used to retrieve the Grant, Session and Consent entities for the Authorization Process.
 */
@Injectable()
export class InteractionHandler {
  /**
   * Instantiates a new Interaction Handler.
   *
   * @param idTokenHandler Instance of the ID Token Handler.
   * @param prompts Prompts registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param sessionService Instance of the Session Service.
   * @param consentService Instance of the Consent Service.
   */
  public constructor(
    private readonly idTokenHandler: IdTokenHandler,
    @InjectAll(PROMPT) private readonly prompts: PromptInterface[],
    @InjectAll(DISPLAY) private readonly displays: DisplayInterface[],
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface
  ) {
    if (this.settings.userInteraction === undefined) {
      throw new TypeError('Missing User Interaction options.');
    }
  }

  /**
   * Handles the Interactions between the End User and the Authorization Server during the Authorization process.
   *
   * Returns the Grant, Session and Consent Entities necessary to finish the Authorization process, or returns
   * a Http Response redirecting the User-Agent to either the Error Page of the Authorization Server,
   * or to an Interaction Endpoint so that the End User can continue the Authorization process.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param cookies Cookies of the Http Authorization Request.
   * @param client Client requesting authorization.
   * @param prompts Prompts requested by the Client.
   * @returns Grant, Session and Consent Entities or Http Interaction Response.
   */
  public async getEntitiesOrHttpResponse(
    parameters: AuthorizationRequest,
    cookies: Record<string, any>,
    client: Client,
    prompts: Prompt[]
  ): Promise<HttpResponse | [Grant | null, Session, Consent]> {
    let display: DisplayInterface;

    try {
      display = this.getDisplay(parameters.display ?? 'page', parameters.state);
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      return this.handleFatalAuthorizationError(error);
    }

    let grant = await this.findGrant(cookies);
    let session = await this.findSession(cookies);
    let consent = await this.findConsent(cookies);

    try {
      for (const prompt of this.prompts) {
        if (!prompts.includes(prompt.name)) {
          continue;
        }

        [grant, session, consent] = await prompt.handle(parameters, client, grant, session, consent);
      }
    } catch (exc: unknown) {
      if (exc instanceof LoginRequiredException) {
        return this.handleFatalAuthorizationError(exc).setCookie('guarani:session', null);
      }

      if (exc instanceof ConsentRequiredException) {
        return this.handleFatalAuthorizationError(exc).setCookie('guarani:consent', null);
      }

      const error = this.asOAuth2Exception(exc, parameters);
      const response = this.handleFatalAuthorizationError(error).setCookies({
        'guarani:grant': null,
        'guarani:session': null,
      });

      if (consent === null) {
        response.setCookie('guarani:consent', null);
      }

      return response;
    }

    // #region Session validation
    try {
      if (session === null) {
        grant ??= await this.grantService.create(parameters, client);

        await this.checkGrant(grant, client, parameters);

        if (grant.session == null) {
          return this.redirectToLoginPage(grant, display);
        }

        session = grant.session;
      }

      if (session.expiresAt != null && new Date() > session.expiresAt) {
        await this.sessionService.remove(session);
        grant ??= await this.grantService.create(parameters, client);
        return this.redirectToLoginPage(grant, display);
      }

      if (
        parameters.id_token_hint !== undefined &&
        !(await this.idTokenHandler.checkIdTokenHint(parameters.id_token_hint, session))
      ) {
        await this.sessionService.remove(session);

        if (grant !== null) {
          await this.grantService.remove(grant);
        }

        throw new LoginRequiredException({
          description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
          state: parameters.state,
        });
      }

      if (parameters.max_age !== undefined) {
        const maxAge = Number.parseInt(parameters.max_age, 10);

        if (session.createdAt.getTime() + maxAge * 1000 <= Date.now()) {
          grant ??= await this.grantService.create(parameters, client);

          if (grant.session == null) {
            grant.session = session;
            await this.grantService.save(grant);
          }

          return this.redirectToLoginPage(grant, display);
        }
      }
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      return this.handleFatalAuthorizationError(error).setCookies({ 'guarani:grant': null, 'guarani:session': null });
    }
    // #endregion

    // #region Consent validation
    try {
      if (consent === null) {
        grant ??= await this.grantService.create(parameters, client);

        if (grant.session == null) {
          grant.session = session;
          await this.grantService.save(grant);
        }

        await this.checkGrant(grant, client, parameters);

        if (grant.consent == null) {
          return this.redirectToConsentPage(grant, session, display);
        }

        consent = grant.consent;
      }

      if (consent.expiresAt != null && new Date() > consent.expiresAt) {
        await this.consentService.remove(consent);

        grant ??= await this.grantService.create(parameters, client);

        if (grant.session == null) {
          grant.session = session;
          await this.grantService.save(grant);
        }

        return this.redirectToConsentPage(grant, session, display);
      }
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);

      return this.handleFatalAuthorizationError(error).setCookies({
        'guarani:grant': null,
        'guarani:session': null,
        'guarani:consent': null,
      });
    }
    // #endregion

    return [grant, session, consent];
  }

  /**
   * Retrieves the Display based on the **display** requested by the Client.
   *
   * @param name Display requested by the Client.
   * @param state Client State prior to the Authorization Request.
   * @returns Display.
   */
  private getDisplay(name: Display, state: string | undefined): DisplayInterface {
    const display = this.displays.find((display) => display.name === name);

    if (display === undefined) {
      throw new InvalidRequestException({ description: `Unsupported display "${name}".`, state });
    }

    return display;
  }

  /**
   * Searches the application's storage for a Grant based on the Identifier in the Cookies of the Http Request.
   *
   * @param cookies Cookies of the Http Request.
   * @returns Grant based on the Cookies.
   */
  private async findGrant(cookies: Record<string, any>): Promise<Grant | null> {
    const grantId: string | undefined = cookies['guarani:grant'];

    if (grantId === undefined) {
      return null;
    }

    return await this.grantService.findOne(grantId);
  }

  /**
   * Searches the application's storage for a Session based on the Identifier in the Cookies of the Http Request.
   *
   * @param cookies Cookies of the Http Request.
   * @returns Session based on the Cookies.
   */
  private async findSession(cookies: Record<string, any>): Promise<Session | null> {
    const sessionId: string | undefined = cookies['guarani:session'];

    if (sessionId === undefined) {
      return null;
    }

    return await this.sessionService.findOne(sessionId);
  }

  /**
   * Searches the application's storage for a Consent based on the Identifier in the Cookies of the Http Request.
   *
   * @param cookies Cookies of the Http Request.
   * @returns Consent based on the Cookies.
   */
  private async findConsent(cookies: Record<string, any>): Promise<Consent | null> {
    const consentId: string | undefined = cookies['guarani:consent'];

    if (consentId === undefined) {
      return null;
    }

    return await this.consentService.findOne(consentId);
  }

  /**
   * Checks if the provided Grant is valid.
   *
   * @param grant Grant of the Request.
   * @param client Client requesting authorization.
   * @param parameters Parameters of the Authorization Request.
   */
  private async checkGrant(grant: Grant, client: Client, parameters: AuthorizationRequest): Promise<void> {
    const { client: grantClient, parameters: grantParameters } = grant;

    const clientIdBuffer = Buffer.from(client.id, 'utf8');
    const grantClientIdBuffer = Buffer.from(grantClient.id, 'utf8');

    try {
      if (
        clientIdBuffer.length !== grantClientIdBuffer.length ||
        !timingSafeEqual(clientIdBuffer, grantClientIdBuffer)
      ) {
        throw new InvalidRequestException({ description: 'Mismatching Client Identifier.', state: parameters.state });
      }

      if (new Date() > grant.expiresAt) {
        throw new InvalidRequestException({ description: 'Expired Grant.', state: parameters.state });
      }

      if (!isDeepStrictEqual(parameters, grantParameters)) {
        throw new InvalidRequestException({
          description: 'One or more parameters changed since the initial request.',
          state: parameters.state,
        });
      }
    } catch (exc: unknown) {
      await this.grantService.remove(grant);
      throw exc;
    }
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Login Page for it to authenticate the User.
   *
   * @param grant Grant of the Request.
   * @param display Display requested by the Client.
   * @returns Http Redirect Response to the Login Page.
   */
  private redirectToLoginPage(grant: Grant, display: DisplayInterface): HttpResponse {
    const url = new URL(this.settings.userInteraction!.loginUrl, this.settings.issuer);
    const parameters: Record<string, any> = { login_challenge: grant.loginChallenge };

    return display
      .createHttpResponse(url.href, parameters)
      .setCookies({ 'guarani:grant': grant.id, 'guarani:session': null });
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Consent Page for it to authenticate the User.
   *
   * @param grant Grant of the Request.
   * @param session Session of the Request.
   * @param display Display requested by the Client.
   * @returns Http Redirect Response to the Consent Page.
   */
  private redirectToConsentPage(grant: Grant, session: Session, display: DisplayInterface): HttpResponse {
    const url = new URL(this.settings.userInteraction!.consentUrl, this.settings.issuer);
    const parameters: Record<string, any> = { consent_challenge: grant.consentChallenge };

    return display
      .createHttpResponse(url.href, parameters)
      .setCookies({ 'guarani:grant': grant.id, 'guarani:session': session.id, 'guarani:consent': null });
  }

  /**
   * Handles a fatal OAuth 2.0 Authorization Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @returns Http Response.
   */
  private handleFatalAuthorizationError(error: OAuth2Exception): HttpResponse {
    const url = new URL(this.settings.userInteraction!.errorUrl, this.settings.issuer);
    const parameters = new URLSearchParams(error.toJSON());

    url.search = parameters.toString();

    return new HttpResponse().redirect(url.href);
  }

  /**
   * Treats the caught exception into a valid OAuth 2.0 Exception.
   *
   * @param exc Exception caught.
   * @param parameters Parameters of the Authorization Request.
   * @returns Treated OAuth 2.0 Exception.
   */
  private asOAuth2Exception(exc: unknown, parameters: AuthorizationRequest): OAuth2Exception {
    let error: OAuth2Exception;

    if (exc instanceof OAuth2Exception) {
      error = exc;
    } else {
      error = new ServerErrorException({ description: 'An unexpected error occurred.', state: parameters.state });
      error.cause = exc;
    }

    if (this.settings.enableAuthorizationResponseIssuerIdentifier) {
      error.setParameter('iss', this.settings.issuer);
    }

    return error;
  }
}
