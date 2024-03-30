import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { URL } from 'url';
import { isDeepStrictEqual } from 'util';

import { Inject, Injectable, InjectAll } from '@guarani/di';
import { Dictionary, Nullable } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
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
import { AuthHandler } from '../handlers/auth.handler';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
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
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { includeAdditionalParameters } from '../utils/include-additional-parameters';
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
   * @param logger Logger of the Authorization Server.
   * @param authHandler Instance of the Auth Handler.
   * @param idTokenHandler Instance of the ID Token Handler.
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param consentService Instance of the Consent Service.
   * @param sessionService Instance of the Session Service.
   * @param validators Authorization Request Validators registered at the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly authHandler: AuthHandler,
    private readonly idTokenHandler: IdTokenHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @InjectAll(AuthorizationRequestValidator) private readonly validators: AuthorizationRequestValidator[],
  ) {
    if (typeof this.settings.userInteraction === 'undefined') {
      const exc = new TypeError('Missing User Interaction options.');

      this.logger.critical(
        `[${this.constructor.name}] Missing User Interaction options`,
        'c131a2df-7ab5-48d2-b774-3018fa53b8b1',
        null,
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '972ebd8a-4540-413c-9ce4-1c808f877162', {
      request,
    });

    const parameters = request.query as AuthorizationRequest;

    let context: AuthorizationContext;

    try {
      this.logger.debug(`[${this.constructor.name}] Http Request validation`, '3ffa33ce-b7df-48c9-bfd8-37148c55c462', {
        request,
      });

      const validator = this.getValidator(parameters);
      context = await validator.validate(request);
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc);

      this.logger.error(
        `[${this.constructor.name}] Error on Authorization Endpoint`,
        '5e87505c-da92-47c1-a788-f715000ea770',
        { request },
        error,
      );

      return this.handleFatalAuthorizationError(error, null);
    }

    const { client, display, idTokenHint, maxAge, prompts, state } = context;

    let grant: Nullable<Grant> = null;
    let login: Nullable<Login> = null;
    let consent: Nullable<Consent> = null;
    let session: Nullable<Session> = null;

    // #region Login validation
    try {
      this.logger.debug(`[${this.constructor.name}] Login validation`, '11b3d532-4347-4ad0-b10f-eba7d057362a', {
        context,
      });

      grant = await this.findGrant(context);

      if (grant !== null) {
        await this.checkGrant(grant, client, parameters);
      }

      session = await this.findSession(context);

      if (session === null) {
        this.logger.debug(
          `[${this.constructor.name}] No previous Session found`,
          'fe000fcb-e6ea-4789-9d63-6fbe2eee215f',
          { context, grant },
        );

        session = await this.sessionService.create();
        return this.reloadAuthorizationEndpoint(session, parameters);
      }

      if (prompts.includes('create')) {
        this.logger.debug(`[${this.constructor.name}] Create Prompt`, '910bb739-60ad-46bf-821b-cf2b934cf879', {
          context,
          session,
          grant,
        });

        grant ??= await this.grantService.create(parameters, client, session);

        if (!grant.interactions.includes('create')) {
          return this.redirectToRegistrationPage(grant, display);
        }
      }

      if (prompts.includes('select_account')) {
        this.logger.debug(`[${this.constructor.name}] Select Account Prompt`, 'a8e193a0-6b9e-4721-a277-9ee94e056356', {
          context,
          session,
          grant,
        });

        if (session.logins.length === 0) {
          const exc = new LoginRequiredException();

          this.logger.error(
            `[${this.constructor.name}] No previous Login found for selection`,
            'e0f504ca-8b79-4d4e-b401-7e9bd2504bc0',
            { context, session, grant },
            exc,
          );

          throw exc;
        }

        grant ??= await this.grantService.create(parameters, client, session);

        if (!grant.interactions.includes('select_account')) {
          return this.redirectToSelectAccountPage(grant, display);
        }
      }

      login = session.activeLogin ?? null;

      // Prompt "login" removes previous authentication result.
      if (prompts.includes('login') && login !== null && grant?.interactions.includes('login') !== true) {
        this.logger.debug(`[${this.constructor.name}] Login Prompt`, '8f6ec02b-766f-43d1-8526-db62b725fa93', {
          context,
          session,
          grant,
        });

        await this.authHandler.inactivateSessionActiveLogin(session);
        login = null;
      }

      if (login === null) {
        this.logger.debug(
          `[${this.constructor.name}] No previous Login found`,
          '0194b3db-a071-4dc7-b3e5-ccdee3218510',
          { context, session, grant },
        );

        if (prompts.includes('none')) {
          const exc = new LoginRequiredException();

          this.logger.error(
            `[${this.constructor.name}] No previous Login found for Prompt None`,
            '3a170b2a-cb39-469c-9840-7758fbe231c8',
            { context, session, grant },
            exc,
          );

          throw exc;
        }

        grant ??= await this.grantService.create(parameters, client, session);
        return this.redirectToLoginPage(grant, display);
      }

      if (login.expiresAt !== null && new Date() > login.expiresAt) {
        this.logger.debug(`[${this.constructor.name}] Login Expired`, 'a7ffccd4-8312-450c-83d5-9d8bbc90dc07', {
          context,
          session,
          login,
          grant,
        });

        await this.authHandler.logout(login, session);

        if (prompts.includes('none')) {
          const exc = new LoginRequiredException();

          this.logger.error(
            `[${this.constructor.name}] Login Expired for Prompt None`,
            'cd90cd75-e5c5-4e05-be0a-fa232e0da8f0',
            { context, session, login, grant },
            exc,
          );

          throw exc;
        }

        grant ??= await this.grantService.create(parameters, client, session);
        return this.redirectToLoginPage(grant, display);
      }

      if (maxAge !== null && new Date() >= new Date(login.createdAt.getTime() + maxAge * 1000)) {
        this.logger.debug(`[${this.constructor.name}] Login is too old`, '82a9addb-1875-41db-a0e5-44dee3227a4f', {
          context,
          session,
          login,
          grant,
        });

        // The activeLogin gets inactivated at the Login Interaction Context.
        if (prompts.includes('none')) {
          const exc = new LoginRequiredException();

          this.logger.error(
            `[${this.constructor.name}] Login is too old for Prompt None`,
            'dddc68dc-da11-4891-b5d2-8e868f78c7e5',
            { context, session, login, grant },
            exc,
          );

          throw exc;
        }

        grant ??= await this.grantService.create(parameters, client, session);
        return this.redirectToLoginPage(grant, display);
      }

      if (idTokenHint !== null && !(await this.idTokenHandler.checkIdTokenHint(idTokenHint, client, login))) {
        await this.authHandler.inactivateSessionActiveLogin(session);

        const exc = new LoginRequiredException(
          'The currently authenticated User is not the one expected by the ID Token Hint.',
        );

        this.logger.error(
          `[${this.constructor.name}] The currently authenticated User is not the one expected by the ID Token Hint`,
          '314704b9-3db1-4c4e-b7dc-abba88006551',
          { context, client, login },
          exc,
        );

        throw exc;
      }
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc);

      this.logger.error(
        `[${this.constructor.name}] Error on Authorization Endpoint`,
        'a268c00c-14bf-4599-ade0-b79751329bf7',
        { request },
        error,
      );

      const response = this.handleFatalAuthorizationError(error, state);

      if (grant !== null) {
        await this.grantService.remove(grant);
        response.setCookie('guarani:grant', null);
      }

      return response;
    }
    // #endregion

    // #region Consent validation
    try {
      this.logger.debug(`[${this.constructor.name}] Consent validation`, 'c83dc38e-58fa-48c8-a301-750f826ed104', {
        context,
      });

      const { user } = login;

      consent = await this.consentService.findOne(client, user);

      // Prompt "consent" removes previous authorization result.
      if (prompts.includes('consent') && consent !== null && grant?.interactions.includes('consent') !== true) {
        this.logger.debug(`[${this.constructor.name}] Consent Prompt`, 'f55ce9eb-7634-436a-bc79-b45c08539d4d', {
          context,
          session,
          grant,
        });

        await this.consentService.remove(consent);
        consent = null;
      }

      if (consent === null) {
        this.logger.debug(
          `[${this.constructor.name}] No previous Consent found`,
          '2c88230f-b3d7-450c-afd9-e5b49225b4c8',
          { context, session, grant },
        );

        if (grant === null || grant.consent === null) {
          if (prompts.includes('none')) {
            const exc = new ConsentRequiredException();

            this.logger.error(
              `[${this.constructor.name}] No previous Consent found for Prompt None`,
              '1d312e29-c5e5-4ad5-8fe2-84064396e94c',
              { context, session, grant },
              exc,
            );

            throw exc;
          }

          grant ??= await this.grantService.create(parameters, client, session);
          return this.redirectToConsentPage(grant, display);
        }

        consent = grant.consent;
      }

      if (consent.expiresAt !== null && new Date() > consent.expiresAt) {
        this.logger.debug(`[${this.constructor.name}] Consent Expired`, 'b96b55e7-b847-46ce-b925-2c9efd240215', {
          context,
          session,
          consent,
          grant,
        });

        await this.consentService.remove(consent);

        if (prompts.includes('none')) {
          const exc = new ConsentRequiredException();

          this.logger.error(
            `[${this.constructor.name}] Consent Expired for Prompt None`,
            'e6b0e484-ed70-4665-b777-bef444434da3',
            { context, session, consent, grant },
            exc,
          );

          throw exc;
        }

        grant ??= await this.grantService.create(parameters, client, session);
        return this.redirectToConsentPage(grant, display);
      }
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc);

      this.logger.error(
        `[${this.constructor.name}] Error on Authorization Endpoint`,
        '1bdacda4-2920-4122-bb88-f5237d1b9de4',
        { request },
        error,
      );

      const response = this.handleFatalAuthorizationError(error, state);

      if (grant !== null) {
        await this.grantService.remove(grant);
        response.setCookie('guarani:grant', null);
      }

      return response;
    }
    // #endregion

    try {
      this.logger.debug(
        `[${this.constructor.name}] Creating the Authorization Response`,
        '65f8a36e-0818-41c2-87f5-04a43ca0e2df',
        { context },
      );

      const authorizationResponse = await context.responseType.handle(context, session.activeLogin!, consent);

      includeAdditionalParameters(authorizationResponse, {
        state,
        iss: this.settings.enableAuthorizationResponseIssuerIdentifier ? this.settings.issuer : null,
      });

      const response = await context.responseMode.createHttpResponse(context, authorizationResponse);

      if (grant !== null) {
        this.logger.debug(`[${this.constructor.name}] Removing the Grant`, '468d120c-1e11-4e39-9721-ae11f43aca1a', {
          context,
          grant,
        });

        await this.grantService.remove(grant);
        response.setCookie('guarani:grant', null);
      }

      this.logger.debug(`[${this.constructor.name}] Authorization completed`, '5d2d8613-5b70-4e1f-b468-618ebd9386ab', {
        response,
      });

      return response;
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc);

      this.logger.error(
        `[${this.constructor.name}] Error on Authorization Endpoint`,
        'fc0a6b45-5ea3-431e-96fb-cea7ca8afddd',
        { request },
        error,
      );

      const response = includeAdditionalParameters(error.toJSON(), {
        state,
        iss: this.settings.enableAuthorizationResponseIssuerIdentifier ? this.settings.issuer : null,
      });

      return await context.responseMode.createHttpResponse(context, response);
    }
  }

  /**
   * Retrieves the Authorization Request Validator based on the Response Type requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Authorization Request Validator.
   */
  private getValidator(parameters: AuthorizationRequest): AuthorizationRequestValidator {
    this.logger.debug(`[${this.constructor.name}] Called getValidator()`, 'b2e735f3-8bc4-49d9-b4a7-ef8b25df1bf7', {
      parameters,
    });

    if (typeof parameters.response_type === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "response_type".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "response_type"`,
        '41df9486-e8d2-44ca-afaa-341e27c1cf25',
        { parameters },
        exc,
      );

      throw exc;
    }

    const responseTypeName = parameters.response_type.split(' ').sort().join(' ') as ResponseType;
    const validator = this.validators.find((validator) => validator.name === responseTypeName);

    if (typeof validator === 'undefined') {
      const exc = new UnsupportedResponseTypeException(`Unsupported response_type "${responseTypeName}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported response_type "${responseTypeName}"`,
        'a63cff49-a503-42fb-a53f-c4fac3ce465b',
        { parameters },
        exc,
      );

      throw exc;
    }

    return validator;
  }

  /**
   * Searches the application's storage for a Grant based on the Identifier in the Cookies of the Http Request.
   *
   * @param context Authorization Request Context.
   * @returns Grant based on the Cookies.
   */
  private async findGrant(context: AuthorizationContext): Promise<Nullable<Grant>> {
    this.logger.debug(`[${this.constructor.name}] Called findGrant()`, 'f5772860-f9b0-4e88-8b36-c7a7d258abb4', {
      context,
    });

    const { cookies } = context;

    if (!Object.hasOwn(cookies, 'guarani:grant')) {
      return null;
    }

    const grantId = cookies['guarani:grant'] as string;

    return await this.grantService.findOne(grantId);
  }

  /**
   * Searches the application's storage for a Session based on the Identifier in the Cookies of the Http Request.
   *
   * @param context Authorization Request Context.
   * @returns Session based on the Cookies.
   */
  private async findSession(context: AuthorizationContext): Promise<Nullable<Session>> {
    this.logger.debug(`[${this.constructor.name}] Called findSession()`, '807c761b-6b06-4880-ad16-990e92676903', {
      context,
    });

    const { cookies } = context;

    if (!Object.hasOwn(cookies, 'guarani:session')) {
      return null;
    }

    const sessionId = cookies['guarani:session'] as string;

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
    this.logger.debug(`[${this.constructor.name}] Called checkGrant()`, '63571aea-2c2f-4a41-817c-15b57e976ad4', {
      grant,
      client,
      parameters,
    });

    const clientId = Buffer.from(client.id, 'utf8');
    const grantClientId = Buffer.from(grant.client.id, 'utf8');

    if (clientId.length !== grantClientId.length || !timingSafeEqual(clientId, grantClientId)) {
      const exc = new InvalidRequestException('Mismatching Client Identifier.');

      this.logger.error(
        `[${this.constructor.name}] Mismatching Client Identifier`,
        '2fb222ee-bc9c-4d8f-9d5c-92582e56ec7d',
        { grant, client },
        exc,
      );

      throw exc;
    }

    if (new Date() > grant.expiresAt) {
      const exc = new InvalidRequestException('Expired Grant.');

      this.logger.error(
        `[${this.constructor.name}] Expired Grant`,
        'b4efe738-033e-4041-9d87-2921f2185276',
        { grant },
        exc,
      );

      throw exc;
    }

    if (!isDeepStrictEqual(parameters, grant.parameters)) {
      const exc = new InvalidRequestException('One or more parameters changed since the initial request.');

      this.logger.error(
        `[${this.constructor.name}] One or more parameters changed since the initial request`,
        '80670caa-b8b3-4bd9-84bf-0b4a496c4169',
        { grant, parameters },
        exc,
      );

      throw exc;
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
    this.logger.debug(
      `[${this.constructor.name}] Called reloadAuthorizationEndpoint()`,
      '182fed4d-63d9-4aab-8334-27d480f542b6',
      { session, parameters },
    );

    const url = addParametersToUrl(new URL(this.path, this.settings.issuer), parameters);
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
    this.logger.debug(
      `[${this.constructor.name}] Called redirectToRegistrationPage()`,
      '3b05610a-7007-434c-8e1c-5382a18e9010',
      { grant, display: display.name },
    );

    const url = new URL(this.settings.userInteraction!.registrationUrl, this.settings.issuer);
    const parameters: Dictionary<string> = { login_challenge: grant.loginChallenge };

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
    this.logger.debug(
      `[${this.constructor.name}] Called redirectToSelectAccountPage()`,
      '6ac731ce-2634-4bee-9416-4f33a2f69bc0',
      { grant, display: display.name },
    );

    const url = new URL(this.settings.userInteraction!.selectAccountUrl, this.settings.issuer);
    const parameters: Dictionary<string> = { login_challenge: grant.loginChallenge };

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
    this.logger.debug(
      `[${this.constructor.name}] Called redirectToLoginPage()`,
      '4d48832f-d67b-4462-a368-d70cb3742a39',
      { grant, display: display.name },
    );

    const url = new URL(this.settings.userInteraction!.loginUrl, this.settings.issuer);
    const parameters: Dictionary<string> = { login_challenge: grant.loginChallenge };

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
    this.logger.debug(
      `[${this.constructor.name}] Called redirectToConsentPage()`,
      '7343587c-5cad-472d-8255-97a541812163',
      { grant, display: display.name },
    );

    const url = new URL(this.settings.userInteraction!.consentUrl, this.settings.issuer);
    const parameters: Dictionary<string> = { consent_challenge: grant.consentChallenge };

    return display.createHttpResponse(url.href, parameters).setCookie('guarani:grant', grant.id);
  }

  /**
   * Handles a fatal OAuth 2.0 Authorization Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @param state State of the Client prior to the End Session Request.
   * @returns Http Response.
   */
  private handleFatalAuthorizationError(error: OAuth2Exception, state: Nullable<string>): HttpResponse {
    this.logger.debug(
      `[${this.constructor.name}] Called handleFatalAuthorizationError()`,
      'cd814f48-50bf-49f1-b98e-15cce7cb82bd',
      { error, state },
    );

    const response = includeAdditionalParameters(error.toJSON(), {
      state,
      iss: this.settings.enableAuthorizationResponseIssuerIdentifier ? this.settings.issuer : null,
    });

    const url = addParametersToUrl(new URL(this.settings.userInteraction!.errorUrl, this.settings.issuer), response);

    return new HttpResponse().redirect(url.href);
  }

  /**
   * Treats the caught exception into a valid OAuth 2.0 Exception.
   *
   * @param exc Exception caught.
   * @returns Treated OAuth 2.0 Exception.
   */
  private asOAuth2Exception(exc: unknown): OAuth2Exception {
    if (exc instanceof OAuth2Exception) {
      return exc;
    }

    return new ServerErrorException('An unexpected error occurred.', { cause: exc });
  }
}
