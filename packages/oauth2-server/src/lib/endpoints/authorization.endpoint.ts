import { Inject, Injectable, InjectAll } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL, URLSearchParams } from 'url';
import { isDeepStrictEqual } from 'util';

import { AuthorizationContext } from '../context/authorization/authorization.context';
import { DisplayInterface } from '../displays/display.interface';
import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ResponseType } from '../response-types/response-type.type';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationRequestValidator } from '../validators/authorization/authorization-request.validator';
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
   * Instantiates a new Authorization Endpoint.
   *
   * @param idTokenHandler Instance of the ID Token Handler.
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param consentService Instance of the Consent Service.
   * @param sessionService Instance of the Session Service.
   * @param validators Authorization Request Validators registered at the Authorization Server.
   */
  public constructor(
    private readonly idTokenHandler: IdTokenHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @InjectAll(AuthorizationRequestValidator)
    private readonly validators: AuthorizationRequestValidator<
      AuthorizationRequest,
      AuthorizationContext<AuthorizationRequest>
    >[]
  ) {
    if (this.settings.userInteraction === undefined) {
      throw new TypeError('Missing User Interaction options.');
    }
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

    let context: AuthorizationContext<AuthorizationRequest>;

    try {
      const validator = this.getValidator(parameters);
      context = await validator.validate(request);
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      return this.handleFatalAuthorizationError(error);
    }

    const { client, display, idTokenHint, maxAge, prompts, redirectUri, state } = context;

    let grant: Grant | null = null;
    let login: Login | null = null;
    let consent: Consent | null = null;
    let session: Session | null = null;

    // #region Login validation
    try {
      grant = await this.findGrant(context);

      if (grant !== null) {
        await this.checkGrant(grant, client, parameters);
      }

      session = await this.findSession(context);

      if (session === null) {
        session = await this.sessionService.create();
        return this.reloadAuthorizationEndpoint(session, parameters);
      }

      if (prompts.includes('create')) {
        grant ??= await this.grantService.create(parameters, client, session);

        if (!grant.interactions.includes('create')) {
          return this.redirectToRegistrationPage(grant, display);
        }
      }

      if (prompts.includes('select_account')) {
        if (session.logins.length === 0) {
          throw new LoginRequiredException({ state });
        }

        grant ??= await this.grantService.create(parameters, client, session);

        if (!grant.interactions.includes('select_account')) {
          return this.redirectToSelectAccountPage(grant, display);
        }
      }

      login = session.activeLogin ?? null;

      // Prompt "login" removes previous authentication result.
      if (prompts.includes('login') && login !== null && grant?.interactions.includes('login') !== true) {
        await this.removeActiveLoginFromSession(session);
        login = null;
      }

      if (login === null) {
        if (prompts.includes('none')) {
          throw new LoginRequiredException({ state });
        }

        grant ??= await this.grantService.create(parameters, client, session);
        return this.redirectToLoginPage(grant, display);
      }

      if (login.expiresAt != null && new Date() > login.expiresAt) {
        await this.removeActiveLoginFromSession(session);

        if (prompts.includes('none')) {
          throw new LoginRequiredException({ state });
        }

        grant ??= await this.grantService.create(parameters, client, session);
        return this.redirectToLoginPage(grant, display);
      }

      if (typeof maxAge !== 'undefined' && new Date() >= new Date(login.createdAt.getTime() + maxAge * 1000)) {
        await this.removeActiveLoginFromSession(session);

        if (prompts.includes('none')) {
          throw new LoginRequiredException({ state });
        }

        grant ??= await this.grantService.create(parameters, client, session);
        return this.redirectToLoginPage(grant, display);
      }

      if (
        typeof idTokenHint !== 'undefined' &&
        !(await this.idTokenHandler.checkIdTokenHint(idTokenHint, client, login))
      ) {
        await this.removeActiveLoginFromSession(session);

        throw new LoginRequiredException({
          description: 'The currently authenticated User is not the one expected by the ID Token Hint.',
          state,
        });
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

    // #region Consent validation
    try {
      const { user } = login;

      consent = await this.consentService.findOne(client, user);

      // Prompt "consent" removes previous authorization result.
      if (prompts.includes('consent') && consent !== null && grant?.interactions.includes('consent') !== true) {
        await this.consentService.remove(consent);
        consent = null;
      }

      if (consent === null) {
        if (grant?.consent == null) {
          if (prompts.includes('none')) {
            throw new ConsentRequiredException({ state });
          }

          grant ??= await this.grantService.create(parameters, client, session);
          return this.redirectToConsentPage(grant, display);
        }

        consent = grant.consent;
      }

      if (consent.expiresAt != null && new Date() > consent.expiresAt) {
        await this.consentService.remove(consent);

        if (prompts.includes('none')) {
          throw new ConsentRequiredException({ state });
        }

        grant ??= await this.grantService.create(parameters, client, session);
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

    try {
      const authorizationResponse = await context.responseType.handle(context, session.activeLogin!, consent);

      if (this.settings.enableAuthorizationResponseIssuerIdentifier) {
        authorizationResponse.iss = this.settings.issuer;
      }

      const response = context.responseMode.createHttpResponse(redirectUri.href, authorizationResponse);

      if (grant !== null) {
        await this.grantService.remove(grant);
        response.setCookie('guarani:grant', null);
      }

      return response;
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      return context.responseMode.createHttpResponse(redirectUri.href, error.toJSON());
    }
  }

  /**
   * Retrieves the Authorization Request Validator based on the Response Type requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Authorization Request Validator.
   */
  private getValidator(
    parameters: AuthorizationRequest
  ): AuthorizationRequestValidator<AuthorizationRequest, AuthorizationContext<AuthorizationRequest>> {
    if (typeof parameters.response_type !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "response_type".' });
    }

    const responseTypeName = <ResponseType>parameters.response_type.split(' ').sort().join(' ');
    const validator = this.validators.find((validator) => validator.name === responseTypeName);

    if (validator === undefined) {
      throw new UnsupportedResponseTypeException({ description: `Unsupported response_type "${responseTypeName}".` });
    }

    return validator;
  }

  /**
   * Searches the application's storage for a Grant based on the Identifier in the Cookies of the Http Request.
   *
   * @param context Authorization Request Context.
   * @returns Grant based on the Cookies.
   */
  private async findGrant(context: AuthorizationContext<AuthorizationRequest>): Promise<Grant | null> {
    const { cookies } = context;

    const grantId: string | undefined = cookies['guarani:grant'];

    if (grantId === undefined) {
      return null;
    }

    return await this.grantService.findOne(grantId);
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
  }

  /**
   * Sets the Session Cookie and reloads the Authorization Endpoint to continue the Authorization Process.
   *
   * @param session Session of the Request.
   * @param parameters Parameters of the Authorization Request.
   * @returns Redirect Response to the Authorization Endpoint with the Session Cookie set.
   */
  private reloadAuthorizationEndpoint(session: Session, parameters: AuthorizationRequest): HttpResponse {
    const url = new URL(this.path, this.settings.issuer);
    const urlParameters = new URLSearchParams(parameters);

    url.search = urlParameters.toString();

    return new HttpResponse().redirect(url).setCookie('guarani:session', session.id);
  }

  /**
   * Redirects the User-Agent to the Authorization Server's User Registration Page for the User to create an Account
   * in order to proceed with the Authorization Process.
   *
   * @param grant Grant of the Request.
   * @param display Display requested by the Client.
   * @returns Http Redirect Response to the User Registration Page.
   */
  private redirectToRegistrationPage(grant: Grant, display: DisplayInterface): HttpResponse {
    const url = new URL(this.settings.userInteraction!.registrationUrl, this.settings.issuer);
    const parameters: Record<string, any> = { login_challenge: grant.loginChallenge };

    return display.createHttpResponse(url.href, parameters).setCookie('guarani:grant', grant.id);
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Select Account Page
   * for the User to select one of its Logins to continue.
   *
   * @param grant Grant of the Request.
   * @param display Display requested by the Client.
   * @returns Http Redirect Response to the Login Page.
   */
  private redirectToSelectAccountPage(grant: Grant, display: DisplayInterface): HttpResponse {
    const url = new URL(this.settings.userInteraction!.selectAccountUrl, this.settings.issuer);
    const parameters: Record<string, any> = { login_challenge: grant.loginChallenge };

    return display.createHttpResponse(url.href, parameters).setCookie('guarani:grant', grant.id);
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

  /**
   * Removes the currently Active Login from the Session.
   *
   * @param session Session of the Request.
   */
  private async removeActiveLoginFromSession(session: Session): Promise<void> {
    session.activeLogin = null;
    await this.sessionService.save(session);
  }
}
