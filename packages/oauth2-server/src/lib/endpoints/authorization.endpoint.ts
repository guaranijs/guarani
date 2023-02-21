import { Inject, Injectable, InjectAll } from '@guarani/di';

import { URL, URLSearchParams } from 'url';

import { Client } from '../entities/client.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { AuthorizationRequest } from '../messages/authorization-request';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../response-modes/response-mode.token';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseTypeInterface } from '../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../response-types/response-type.token';
import { ResponseType } from '../response-types/response-type.type';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Authorization** Endpoint.
 *
 * This endpoint is used to provide an Authorization Grant for the requesting Client on behalf of the End User.
 *
 * Since the OAuth 2.0 Spec does not define the need for authentication when using this endpoint, it is left omitted.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-3.1
 */
@Injectable()
export class AuthorizationEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'authorization';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/authorize';

  /**
   * Http methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET'];

  /**
   * Url of the Error Page.
   */
  private readonly consentUrl: string;

  /**
   * URL of the Error Page.
   */
  private readonly errorUrl: string;

  /**
   * URL of the Error Page.
   */
  private readonly loginUrl: string;

  /**
   * Instantiates a new Authorization Endpoint.
   *
   * @param scopeHandler Instance of the Scope Handler.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param sessionService Instance of the Session Service.
   * @param consentService Instance of the Consent Service.
   * @param grantService Instance of the Grant Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    @InjectAll(RESPONSE_TYPE) private readonly responseTypes: ResponseTypeInterface[],
    @InjectAll(RESPONSE_MODE) private readonly responseModes: ResponseModeInterface[],
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface
  ) {
    if (this.settings.userInteraction === undefined) {
      throw new TypeError('Missing User Interaction options.');
    }

    const {
      issuer,
      userInteraction: { consentUrl, errorUrl, loginUrl },
    } = this.settings;

    this.consentUrl = new URL(consentUrl, issuer).href;
    this.errorUrl = new URL(errorUrl, issuer).href;
    this.loginUrl = new URL(loginUrl, issuer).href;
  }

  /**
   * Creates a Http Redirect Authorization Response.
   *
   * Any error is safely redirected to the Redirect URI provided by the Client in the Authorization Request,
   * or to the Authorization Server's Error Endpoint, should the error not be returned to the Client's Redirect URI.
   *
   * If the authorization flow of the grant results in a successful response, it will redirect the User-Agent
   * to the Redirect URI provided by the Client.
   *
   * This method **REQUIRES** consent given by the User, be it implicit or explicit.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <AuthorizationRequest>request.query;

    let client: Client;
    let responseType: ResponseTypeInterface;
    let responseMode: ResponseModeInterface;

    try {
      this.checkParameters(parameters);

      client = await this.getClient(parameters.client_id, parameters.state);
      responseType = this.getResponseType(parameters.response_type, parameters.state);

      this.checkClientResponseType(client, responseType, parameters.state);
      this.checkClientRedirectUri(client, parameters.redirect_uri, parameters.state);
      this.checkClientScope(client, parameters.scope, parameters.state);

      responseMode = this.getResponseMode(
        parameters.response_mode ?? responseType.defaultResponseMode,
        parameters.state
      );
    } catch (exc: unknown) {
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

      return this.handleFatalAuthorizationError(error);
    }

    // TODO: Check the entities' parameters against the request's parameters.
    try {
      let grant: Grant | null = null;

      const { cookies } = request;

      let session = await this.findSession(cookies);

      if (session === null) {
        grant = await this.findGrant(cookies);

        // Starting from scratch.
        if (grant === null) {
          grant = await this.grantService.create(parameters, client);
          return this.redirectToLoginPage(grant).setCookies({ 'guarani:grant': grant.id, 'guarani:session': null });
        }

        // Hit the login endpoint but didn't go through with it.
        if (grant.session == null) {
          return this.redirectToLoginPage(grant).setCookies({ 'guarani:grant': grant.id, 'guarani:session': null });
        }

        session = grant.session;

        if (session.expiresAt != null && new Date() > session.expiresAt) {
          await this.sessionService.remove(session);
          return this.redirectToLoginPage(grant).setCookies({ 'guarani:grant': grant.id, 'guarani:session': null });
        }
      }

      const { user } = session;

      let consent = await this.consentService.findOne(client.id, user.id);

      if (consent === null) {
        grant = await this.findGrant(cookies);

        // Consent was revoked and we need to get it once again.
        if (grant === null) {
          grant = await this.grantService.create(parameters, client);

          return this.redirectToConsentPage(grant).setCookies({
            'guarani:grant': grant.id,
            'guarani:session': session.id,
            'guarani:consent': null,
          });
        }

        // Hit the consent endpoint but didn't go through with it.
        if (grant.consent == null) {
          return this.redirectToConsentPage(grant).setCookies({
            'guarani:grant': grant.id,
            'guarani:session': session.id,
            'guarani:consent': null,
          });
        }

        consent = grant.consent;

        if (consent.expiresAt != null && new Date() > consent.expiresAt) {
          await this.consentService.remove(consent);

          return this.redirectToConsentPage(grant).setCookies({
            'guarani:grant': grant.id,
            'guarani:session': session.id,
            'guarani:consent': null,
          });
        }
      }

      const authorizationResponse = await responseType.handle(consent);

      if (this.settings.enableAuthorizationResponseIssuerIdentifier) {
        authorizationResponse.iss = this.settings.issuer;
      }

      if (grant !== null) {
        await this.grantService.remove(grant);
      }

      return responseMode.createHttpResponse(parameters.redirect_uri, authorizationResponse).setCookies({
        'guarani:grant': null,
        'guarani:session': session.id,
        'guarani:consent': consent.id,
      });
    } catch (exc: unknown) {
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

      return responseMode.createHttpResponse(parameters.redirect_uri, error.toJSON());
    }
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: AuthorizationRequest): void {
    const { response_type: responseType, client_id: clientId, redirect_uri: redirectUri, scope } = parameters;

    if (typeof responseType !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "response_type".', state: parameters.state });
    }

    if (typeof clientId !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "client_id".', state: parameters.state });
    }

    if (typeof redirectUri !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".', state: parameters.state });
    }

    if (typeof scope !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "scope".', state: parameters.state });
    }
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param clientId Identifier of the Client.
   * @param state Client State prior to the Authorization Request.
   * @returns Client based on the provided Client Identifier.
   */
  private async getClient(clientId: string, state?: string): Promise<Client> {
    const client = await this.clientService.findOne(clientId);

    if (client === null) {
      throw new InvalidClientException({ description: 'Invalid Client.', state });
    }

    return client;
  }

  /**
   * Retrieves the Response Type based on the **response_type** requested by the Client.
   *
   * @param name Response Type requested by the Client.
   * @param state Client State prior to the Authorization Request.
   * @returns Response Type.
   */
  private getResponseType(name: ResponseType, state?: string): ResponseTypeInterface {
    const responseType = this.responseTypes.find((responseType) => responseType.name === name);

    if (responseType === undefined) {
      throw new UnsupportedResponseTypeException({ description: `Unsupported response_type "${name}".`, state });
    }

    return responseType;
  }

  /**
   * Checks if the Client is allowed to use the requested Response Type.
   *
   * @param client Client of the Request.
   * @param responseType Response Type requested by the Client.
   * @param state Client State prior to the Authorization Request.
   */
  private checkClientResponseType(client: Client, responseType: ResponseTypeInterface, state?: string): void {
    if (!client.responseTypes.includes(responseType.name)) {
      throw new UnauthorizedClientException({
        description: `This Client is not allowed to request the response_type "${responseType.name}".`,
        state,
      });
    }
  }

  /**
   * Checks the provided Redirect URI against the registered Redirect URIs of the Client.
   *
   * @param client Client of the Request.
   * @param redirectUri Redirect URI provided by the Client.
   * @param state Client State prior to the Authorization Request.
   */
  private checkClientRedirectUri(client: Client, redirectUri: string, state?: string): void {
    if (!client.redirectUris.includes(redirectUri)) {
      throw new AccessDeniedException({ description: 'Invalid Redirect URI.', state });
    }
  }

  /**
   * Checks if the provided scope is supported by the Authorization Server and if the Client is allowed to request it.
   *
   * @param client Client of the Request.
   * @param scope Scope requested by the Client.
   * @param state Client State prior to the Authorization Request.
   */
  private checkClientScope(client: Client, scope: string, state?: string): void {
    this.scopeHandler.checkRequestedScope(scope, state);

    scope.split(' ').forEach((requestedScope) => {
      if (!client.scopes.includes(requestedScope)) {
        throw new AccessDeniedException({
          description: `The Client is not allowed to request the scope "${requestedScope}".`,
          state,
        });
      }
    });
  }

  /**
   * Retrieves the Response Mode based on the **response_mode** requested by the Client.
   *
   * @param name Response Mode requested by the Client.
   * @param state Client State prior to the Authorization Request.
   * @returns Response Mode.
   */
  private getResponseMode(name: ResponseMode, state?: string): ResponseModeInterface {
    const responseMode = this.responseModes.find((responseMode) => responseMode.name === name);

    if (responseMode === undefined) {
      throw new InvalidRequestException({ description: `Unsupported response_mode "${name}".`, state });
    }

    return responseMode;
  }

  /**
   * Handles a fatal OAuth 2.0 Authorization Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @returns Http Response.
   */
  private handleFatalAuthorizationError(error: OAuth2Exception): HttpResponse {
    const url = new URL(this.errorUrl);
    const parameters = new URLSearchParams(error.toJSON());

    url.search = parameters.toString();

    return new HttpResponse().redirect(url.href);
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

    const session = await this.sessionService.findOne(sessionId);

    if (session === null) {
      return null;
    }

    return session;
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

    const grant = await this.grantService.findOne(grantId);

    if (grant === null) {
      return null;
    }

    if (grant.expiresAt != null && new Date() > grant.expiresAt) {
      await this.grantService.remove(grant);
      return null;
    }

    return grant;
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Login Page for it to authenticate the User.
   *
   * @param grant Grant of the Request.
   * @returns Http Redirect Response to the Login Page.
   */
  private redirectToLoginPage(grant: Grant): HttpResponse {
    const redirectUrl = new URL(this.loginUrl);
    const searchParameters = new URLSearchParams({ login_challenge: grant.loginChallenge });

    redirectUrl.search = searchParameters.toString();

    return new HttpResponse().redirect(redirectUrl);
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Consent Page for it to authenticate the User.
   *
   * @param grant Grant of the Request.
   * @returns Http Redirect Response to the Consent Page.
   */
  private redirectToConsentPage(grant: Grant): HttpResponse {
    const redirectUrl = new URL(this.consentUrl);
    const searchParams = new URLSearchParams({ consent_challenge: grant.consentChallenge });

    redirectUrl.search = searchParams.toString();

    return new HttpResponse().redirect(redirectUrl);
  }
}
