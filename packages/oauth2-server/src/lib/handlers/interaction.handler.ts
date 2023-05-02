import { Inject, Injectable } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL, URLSearchParams } from 'url';
import { isDeepStrictEqual } from 'util';

import { AuthorizationContext } from '../context/authorization/authorization.context';
import { DisplayInterface } from '../displays/display.interface';
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
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param sessionService Instance of the Session Service.
   * @param consentService Instance of the Consent Service.
   */
  public constructor(
    private readonly idTokenHandler: IdTokenHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface
  ) {
    if (typeof this.settings.userInteraction === 'undefined') {
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
   * @param context Authorization Request Context.
   * @returns Session and Consent Entities or Http Interaction Response.
   */
  public async getEntitiesOrHttpResponse(
    context: AuthorizationContext<AuthorizationRequest>
  ): Promise<HttpResponse | [Grant | null, Session, Consent]> {
    const { client, display, idTokenHint, maxAge, parameters, prompts } = context;

    let grant: Grant | null = null;
    let session: Session | null = null;
    let consent: Consent | null = null;

    // #region Session validation
    try {
      grant = await this.findGrant(context);
      session = await this.findSession(context);

      // Prompt "login" removes previous authentication result.
      if (session !== null && grant?.session == null && prompts.includes('login')) {
        await this.sessionService.remove(session);
        session = null;
      }

      if (session === null) {
        if (grant?.session == null) {
          if (prompts.includes('none')) {
            throw new LoginRequiredException({ state: parameters.state });
          }

          grant ??= await this.grantService.create(parameters, client);
          return this.redirectToLoginPage(grant, display);
        }

        session = grant.session;
      }

      if (session.expiresAt != null && new Date() > session.expiresAt) {
        await this.sessionService.remove(session);

        if (prompts.includes('none')) {
          throw new LoginRequiredException({ state: parameters.state });
        }

        grant ??= await this.grantService.create(parameters, client);
        return this.redirectToLoginPage(grant, display);
      }

      if (typeof maxAge !== 'undefined' && new Date() >= new Date(session.createdAt.getTime() + maxAge * 1000)) {
        await this.sessionService.remove(session);

        if (prompts.includes('none')) {
          throw new LoginRequiredException({ state: parameters.state });
        }

        grant ??= await this.grantService.create(parameters, client);
        return this.redirectToLoginPage(grant, display);
      }

      if (typeof idTokenHint !== 'undefined' && !(await this.idTokenHandler.checkIdTokenHint(idTokenHint, session))) {
        await this.sessionService.remove(session);

        throw new LoginRequiredException({
          description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
          state: parameters.state,
        });
      }
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      const response = this.handleFatalAuthorizationError(error).setCookie('guarani:session', null);

      if (grant !== null) {
        await this.grantService.remove(grant);
        response.setCookie('guarani:grant', null);
      }

      return response;
    }
    // #endregion

    // #region Consent validation
    try {
      const { user } = session;

      consent = await this.consentService.findOne(client, user);

      // Prompt "consent" removes previous authorization result.
      if (consent !== null && grant?.consent == null && prompts.includes('consent')) {
        await this.consentService.remove(consent);
        consent = null;
      }

      if (consent === null) {
        if (grant?.consent == null) {
          if (prompts.includes('none')) {
            throw new ConsentRequiredException({ state: parameters.state });
          }

          grant ??= await this.grantService.create(parameters, client);
          return this.redirectToConsentPage(grant, display);
        }

        consent = grant.consent;
      }

      if (consent.expiresAt != null && new Date() > consent.expiresAt) {
        await this.consentService.remove(consent);

        if (prompts.includes('none')) {
          throw new ConsentRequiredException({ state: parameters.state });
        }

        grant ??= await this.grantService.create(parameters, client);
        return this.redirectToConsentPage(grant, display);
      }
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      const response = this.handleFatalAuthorizationError(error);

      if (grant !== null) {
        await this.grantService.remove(grant);
        response.setCookie('guarani:grant', null);
      }

      return response;
    }
    // #endregion

    return [grant, session, consent];
  }

  /**
   * Searches the application's storage for a Grant based on the Identifier in the Cookies of the Http Request.
   *
   * @param context Authorization Request Context.
   * @returns Grant based on the Cookies.
   */
  private async findGrant(context: AuthorizationContext<AuthorizationRequest>): Promise<Grant | null> {
    const { client, cookies, parameters } = context;

    const grantId: string | undefined = cookies['guarani:grant'];

    if (grantId === undefined) {
      return null;
    }

    const grant = await this.grantService.findOne(grantId);

    if (grant !== null) {
      await this.checkGrant(grant, client, parameters);
    }

    return grant;
  }

  /**
   * Searches the application's storage for a Session based on the Identifier in the Cookies of the Http Request.
   *
   * @param context Authorization Request Context.
   * @returns Session based on the Cookies.
   */
  private async findSession(context: AuthorizationContext<AuthorizationRequest>): Promise<Session | null> {
    const { cookies } = context;

    const sessionId: string | undefined = cookies['guarani:session'];

    if (sessionId === undefined) {
      return null;
    }

    return await this.sessionService.findOne(sessionId);
  }

  /**
   * Checks if the provided Grant is valid.
   *
   * @param grant Grant of the Request.
   * @param client Client requesting authorization.
   * @param parameters Parameters of the Authorization Request.
   */
  private async checkGrant(grant: Grant, client: Client, parameters: AuthorizationRequest): Promise<void> {
    try {
      const clientId = Buffer.from(client.id, 'utf8');
      const grantClientId = Buffer.from(grant.client.id, 'utf8');

      if (clientId.length !== grantClientId.length || !timingSafeEqual(clientId, grantClientId)) {
        throw new InvalidRequestException({ description: 'Mismatching Client Identifier.', state: parameters.state });
      }

      if (new Date() > grant.expiresAt) {
        throw new InvalidRequestException({ description: 'Expired Grant.', state: parameters.state });
      }

      if (!isDeepStrictEqual(parameters, grant.parameters)) {
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

    return display.createHttpResponse(url.href, parameters).setCookie('guarani:grant', grant.id);
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Consent Page for it to authenticate the User.
   *
   * @param grant Grant of the Request.
   * @param display Display requested by the Client.
   * @returns Http Redirect Response to the Consent Page.
   */
  private redirectToConsentPage(grant: Grant, display: DisplayInterface): HttpResponse {
    const url = new URL(this.settings.userInteraction!.consentUrl, this.settings.issuer);
    const parameters: Record<string, any> = { consent_challenge: grant.consentChallenge };

    return display.createHttpResponse(url.href, parameters).setCookie('guarani:grant', grant.id);
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
