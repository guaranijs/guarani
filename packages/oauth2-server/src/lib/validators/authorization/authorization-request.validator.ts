import { URL } from 'url';

import { Optional } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { AuthorizationContext } from '../../context/authorization/authorization-context';
import { DisplayInterface } from '../../displays/display.interface';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidClientException } from '../../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { UnauthorizedClientException } from '../../exceptions/unauthorized-client.exception';
import { ClaimsHandler } from '../../handlers/claims.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { ResponseMode } from '../../response-modes/response-mode.type';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { ResponseType } from '../../response-types/response-type.type';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { Settings } from '../../settings/settings';
import { AuthorizationRequestClaimsParameter } from '../../types/authorization-request-claims-parameter.type';
import { Prompt } from '../../types/prompt.type';

/**
 * Implementation of the Authorization Request Validator.
 */
export abstract class AuthorizationRequestValidator<TContext extends AuthorizationContext = AuthorizationContext> {
  /**
   * Name of the Response Type that uses this Validator.
   */
  public abstract readonly name: ResponseType;

  /**
   * Instantiates a new Authorization Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   * @param claimsHandler Instance of the Claims Handler.
   */
  public constructor(
    protected readonly logger: Logger,
    protected readonly scopeHandler: ScopeHandler,
    protected readonly settings: Settings,
    protected readonly clientService: ClientServiceInterface,
    protected readonly responseModes: ResponseModeInterface[],
    protected readonly responseTypes: ResponseTypeInterface[],
    protected readonly displays: DisplayInterface[],
    @Optional() protected readonly claimsHandler?: ClaimsHandler,
  ) {
    if (this.settings.enableClaimsAuthorizationRequestParameter && typeof this.claimsHandler === 'undefined') {
      const exc = new TypeError('Cannot use the "claims" Authorization Request parameter without a Claims Handler.');

      this.logger.critical(
        `[${this.constructor.name}] Cannot use the "claims" Authorization Request parameter without a Claims Handler`,
        '868902cd-befb-4511-853d-cb08301ac3f2',
        null,
        exc,
      );

      throw exc;
    }
  }

  /**
   * Validates the Http Authorization Request and returns the actors of the Authorization Context.
   *
   * @param request Http Request.
   * @returns Authorization Context.
   */
  public async validate(request: HttpRequest): Promise<TContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, 'aa6338b1-d940-4d2b-9322-cd0d1daf8e04', {
      request,
    });

    const parameters = request.query as AuthorizationRequest;
    const cookies = request.cookies;

    const client = await this.getClient(parameters);
    const responseType = this.getResponseType(parameters, client);
    const redirectUri = this.getRedirectUri(parameters, client);
    let scopes = this.getScopes(parameters, client);
    const state = this.getState(parameters);
    const responseMode = this.getResponseMode(parameters, responseType, client);
    const nonce = this.getNonce(parameters);
    const prompts = this.getPrompts(parameters);
    const display = this.getDisplay(parameters);
    const maxAge = this.getMaxAge(parameters);
    const loginHint = this.getLoginHint(parameters);
    const idTokenHint = this.getIdTokenHint(parameters);
    const uiLocales = this.getUiLocales(parameters);
    const acrValues = this.getAcrValues(parameters);
    const claims = this.getClaims(parameters, client);

    scopes = this.checkOfflineAccessScope(scopes, prompts, responseType);

    const context = <TContext>{
      parameters,
      cookies,
      responseType,
      client,
      redirectUri,
      scopes,
      state,
      responseMode,
      nonce,
      prompts,
      display,
      maxAge,
      loginHint,
      idTokenHint,
      uiLocales,
      acrValues,
      claims,
    };

    this.logger.debug(
      `[${this.constructor.name}] Authorization Request validation completed`,
      'aa6338b1-d940-4d2b-9322-cd0d1daf8e04',
      { context },
    );

    return context;
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Client based on the provided Client Identifier.
   */
  protected async getClient(parameters: AuthorizationRequest): Promise<Client> {
    this.logger.debug(`[${this.constructor.name}] Called getClient()`, '451fa840-de32-45cb-b389-e268e40a5a4a', {
      parameters,
    });

    if (typeof parameters.client_id === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "client_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "client_id"`,
        '354773d7-7a99-444e-ad50-35169865970e',
        { parameters },
        exc,
      );

      throw exc;
    }

    const client = await this.clientService.findOne(parameters.client_id);

    if (client === null) {
      const exc = new InvalidClientException('Invalid Client.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Client`,
        'd38c51c7-35d0-4c3a-8667-af25e4184991',
        { parameters },
        exc,
      );

      throw exc;
    }

    return client;
  }

  /**
   * Retrieves the Response Type requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client requesting authorization.
   * @returns Response Type.
   */
  protected getResponseType(parameters: AuthorizationRequest, client: Client): ResponseTypeInterface {
    this.logger.debug(`[${this.constructor.name}] Called getResponseType()`, 'cde50a8f-8b94-4e10-8124-cee957cf51c2', {
      parameters,
      client,
    });

    const name = parameters.response_type!.split(' ').sort().join(' ') as ResponseType;
    const responseType = this.responseTypes.find((responseType) => responseType.name === name)!;

    if (!client.responseTypes.includes(responseType.name)) {
      const exc = new UnauthorizedClientException(
        `This Client is not allowed to request the response_type "${responseType.name}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] This Client is not allowed to request the response_type "${responseType.name}"`,
        'abfa0812-dd05-4784-9c52-d8c1ed2c9be2',
        { parameters },
        exc,
      );

      throw exc;
    }

    return responseType;
  }

  /**
   * Parses and validates the Redirect URI provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client requesting authorization.
   * @returns Parsed and validated Redirect URI.
   */
  protected getRedirectUri(parameters: AuthorizationRequest, client: Client): URL {
    this.logger.debug(`[${this.constructor.name}] Called getRedirectUri()`, 'ef6568e0-4fb0-48a7-a5ee-dd502f6a420f', {
      parameters,
      client,
    });

    if (typeof parameters.redirect_uri === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "redirect_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "redirect_uri"`,
        '2640d903-baf0-47e7-a420-56972f111aa2',
        { parameters },
        exc,
      );

      throw exc;
    }

    let redirectUri: URL;

    try {
      redirectUri = new URL(parameters.redirect_uri);
    } catch (exc: unknown) {
      const exception = new InvalidRequestException('Invalid parameter "redirect_uri".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "redirect_uri"`,
        '6037286d-5396-4b5f-b84f-21b85aac674c',
        { parameters },
        exception,
      );

      throw exception;
    }

    if (redirectUri.hash.length !== 0) {
      const exc = new InvalidRequestException('The Redirect URI MUST NOT have a fragment component.');

      this.logger.error(
        `[${this.constructor.name}] The Redirect URI MUST NOT have a fragment component`,
        'eb620184-39a8-4af4-ba60-7b4dace21448',
        { redirect_uri: redirectUri.href },
        exc,
      );

      throw exc;
    }

    if (!client.redirectUris.includes(redirectUri.href)) {
      const exc = new AccessDeniedException('Invalid Redirect URI.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Redirect URI`,
        '484f7e9a-dbab-4d47-b2c7-1d7c4351f2e9',
        { redirect_uri: redirectUri.href, client },
        exc,
      );

      throw exc;
    }

    return redirectUri;
  }

  /**
   * Checks if the provided scope is supported by the Authorization Server and if the Client is allowed to request it,
   * then return the granted scopes for further processing.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client requesting authorization.
   * @returns Scopes granted to the Client.
   */
  protected getScopes(parameters: AuthorizationRequest, client: Client): string[] {
    this.logger.debug(`[${this.constructor.name}] Called getScopes()`, '3d805d51-5e4a-4bfb-ad41-5c1d75aa286a', {
      parameters,
      client,
    });

    if (typeof parameters.scope === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "scope".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "scope"`,
        '73f82992-2002-4283-b63e-53c50e8cae6d',
        { parameters },
        exc,
      );

      throw exc;
    }

    this.scopeHandler.checkRequestedScope(parameters.scope);

    return this.scopeHandler.getAllowedScopes(client, parameters.scope);
  }

  /**
   * Checks and returns the State provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns State provided by the Client.
   */
  protected getState(parameters: AuthorizationRequest): Nullable<string> {
    this.logger.debug(`[${this.constructor.name}] Called getState()`, '575c144a-7b34-47cd-a6da-3a52f3e97e7c', {
      parameters,
    });

    return parameters.state ?? null;
  }

  /**
   * Retrieves the Response Mode requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param responseType Response Type requested by the Client.
   * @param client Client requesting authorization.
   * @returns Response Mode.
   */
  protected getResponseMode(
    parameters: AuthorizationRequest,
    responseType: ResponseTypeInterface,
    client: Client,
  ): ResponseModeInterface {
    this.logger.debug(`[${this.constructor.name}] Called getResponseMode()`, '7dc16e70-9574-4f56-9148-338c3afc3675', {
      parameters,
      response_type: responseType.name,
      client,
    });

    const responseModeName =
      parameters.response_mode === 'jwt'
        ? `${responseType.defaultResponseMode}.jwt`
        : (parameters.response_mode ?? responseType.defaultResponseMode);

    const responseMode = this.responseModes.find((responseMode) => responseMode.name === responseModeName);

    if (typeof responseMode === 'undefined') {
      const exc = new InvalidRequestException(`Unsupported response_mode "${responseModeName}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported response_mode "${responseModeName}"`,
        'f7d16e6e-6bcf-4717-93da-4a5c3a414e8e',
        { parameters },
        exc,
      );

      throw exc;
    }

    const jwtResponseModes: ResponseMode[] = ['form_post.jwt', 'fragment.jwt', 'jwt', 'query.jwt'];

    if (jwtResponseModes.includes(responseMode.name) && client.authorizationSignedResponseAlgorithm === null) {
      const exc = new InvalidRequestException(
        `This Client is not allowed to request the Response Mode "${responseModeName}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] This Client is not allowed to request the Response Mode "${responseModeName}"`,
        'cb775110-e2fc-4cb3-b3fc-9e3e9d628db3',
        { parameters },
        exc,
      );

      throw exc;
    }

    return responseMode;
  }

  /**
   * Checks and returns the Nonce provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Nonce provided by the Client.
   */
  protected getNonce(parameters: AuthorizationRequest): Nullable<string> {
    this.logger.debug(`[${this.constructor.name}] Called getNonce()`, 'd5021d0e-6084-481b-a6df-5b7820e42d8a', {
      parameters,
    });

    return parameters.nonce ?? null;
  }

  /**
   * Returns the Prompts requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Prompts requested by the Client.
   */
  protected getPrompts(parameters: AuthorizationRequest): Prompt[] {
    this.logger.debug(`[${this.constructor.name}] Called getPrompts()`, '55bf11a9-ee75-463b-9fd0-d660cc3da3ae', {
      parameters,
    });

    const requestedPrompts = (parameters.prompt?.split(' ') ?? []) as Prompt[];
    const supportedPromptsNames: Prompt[] = ['consent', 'create', 'login', 'none', 'select_account'];

    requestedPrompts.forEach((prompt) => {
      if (!supportedPromptsNames.includes(prompt)) {
        const exc = new InvalidRequestException(`Unsupported prompt "${prompt}".`);

        this.logger.error(
          `[${this.constructor.name}] Unsupported prompt "${prompt}"`,
          '1e94b0f2-ba3d-4bda-80cc-be274446a2c6',
          { parameters },
          exc,
        );

        throw exc;
      }
    });

    if (requestedPrompts.includes('none') && requestedPrompts.length !== 1) {
      const exc = new InvalidRequestException('The prompt "none" must be used by itself.');

      this.logger.error(
        `[${this.constructor.name}] The prompt "none" must be used by itself`,
        'c41b5e53-b4fb-4aef-80c4-14b989fc72ae',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (requestedPrompts.includes('create') && requestedPrompts.includes('login')) {
      const exc = new InvalidRequestException('The prompts "create" and "login" cannot be used together.');

      this.logger.error(
        `[${this.constructor.name}] The prompts "create" and "login" cannot be used together`,
        '68dc7d50-1ce6-43fd-b96b-98c51427fa00',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (requestedPrompts.includes('create') && requestedPrompts.includes('select_account')) {
      const exc = new InvalidRequestException('The prompts "create" and "select_account" cannot be used together.');

      this.logger.error(
        `[${this.constructor.name}] The prompts "create" and "select_account" cannot be used together`,
        '68479db2-699b-4995-9b3e-3539bab00be1',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (requestedPrompts.includes('login') && requestedPrompts.includes('select_account')) {
      const exc = new InvalidRequestException('The prompts "login" and "select_account" cannot be used together.');

      this.logger.error(
        `[${this.constructor.name}] The prompts "login" and "select_account" cannot be used together`,
        '4320e86d-d99d-45f4-a93e-48def43ff4b9',
        { parameters },
        exc,
      );

      throw exc;
    }

    return requestedPrompts;
  }

  /**
   * Retrieves the Display requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Display.
   */
  protected getDisplay(parameters: AuthorizationRequest): DisplayInterface {
    this.logger.debug(`[${this.constructor.name}] Called getDisplay()`, '87bfc15a-28db-4a10-a416-91f7539d8e3c', {
      parameters,
    });

    const displayName = parameters.display ?? 'page';
    const display = this.displays.find((display) => display.name === displayName);

    if (typeof display === 'undefined') {
      const exc = new InvalidRequestException(`Unsupported display "${displayName}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported display "${displayName}"`,
        '739cd367-963d-4e9c-841b-43647f3520f8',
        { parameters },
        exc,
      );

      throw exc;
    }

    return display;
  }

  /**
   * Checks and returns the parsed Max Age provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Parsed Max Age.
   */
  protected getMaxAge(parameters: AuthorizationRequest): Nullable<number> {
    this.logger.debug(`[${this.constructor.name}] Called getMaxAge()`, '086f9fb3-6bc4-4c1c-b5f4-34d03036ea3d', {
      parameters,
    });

    if (typeof parameters.max_age === 'undefined') {
      return null;
    }

    if (!/^(0|[1-9]\d*)$/g.test(parameters.max_age)) {
      const exc = new InvalidRequestException('Invalid parameter "max_age".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "max_age"`,
        '73706208-2ad3-4568-8801-23289008a6db',
        { parameters },
        exc,
      );

      throw exc;
    }

    return Number.parseInt(parameters.max_age, 10);
  }

  /**
   * Checks and returns the Login Hint provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Login Hint provided by the Client.
   */
  protected getLoginHint(parameters: AuthorizationRequest): Nullable<string> {
    this.logger.debug(`[${this.constructor.name}] Called getLoginHint()`, '41b11092-ef91-4a3e-b8d7-468fa61bedcd', {
      parameters,
    });

    return parameters.login_hint ?? null;
  }

  /**
   * Checks and returns the ID Token Hint provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns ID Token Hint provided by the Client.
   */
  protected getIdTokenHint(parameters: AuthorizationRequest): Nullable<string> {
    this.logger.debug(`[${this.constructor.name}] Called getIdTokenHint()`, '960de523-3e1f-4c04-a91d-ff5456ba31b7', {
      parameters,
    });

    return parameters.id_token_hint ?? null;
  }

  /**
   * Checks and returns the UI Locales requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns UI Locales requested by the Client.
   */
  protected getUiLocales(parameters: AuthorizationRequest): string[] {
    this.logger.debug(`[${this.constructor.name}] Called getUiLocales()`, '0a521a8a-963e-48b4-99ce-c98a92a25cdd', {
      parameters,
    });

    const requestedUiLocales = parameters.ui_locales?.split(' ') ?? [];

    requestedUiLocales.forEach((requestedUiLocale) => {
      if (!this.settings.uiLocales.includes(requestedUiLocale)) {
        const exc = new InvalidRequestException(`Unsupported UI Locale "${requestedUiLocale}".`);

        this.logger.error(
          `[${this.constructor.name}] Unsupported UI Locale "${requestedUiLocale}"`,
          'f53991a0-2891-4155-ac41-dec761a4d6ca',
          { parameters },
          exc,
        );

        throw exc;
      }
    });

    return requestedUiLocales;
  }

  /**
   * Checks and returns the Authentication Context Class References requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Authentication Context Class References requested by the Client.
   */
  protected getAcrValues(parameters: AuthorizationRequest): string[] {
    this.logger.debug(`[${this.constructor.name}] Called getAcrValues()`, '320cbdff-bca2-4795-9d6b-59ce9e3a277c', {
      parameters,
    });

    const requestedAcrValues = parameters.acr_values?.split(' ') ?? [];

    requestedAcrValues.forEach((requestedAcrValue) => {
      if (!this.settings.acrValues.includes(requestedAcrValue)) {
        const exc = new InvalidRequestException(
          `Unsupported Authentication Context Class Reference "${requestedAcrValue}".`,
        );

        this.logger.error(
          `[${this.constructor.name}] Unsupported Authentication Context Class Reference "${requestedAcrValue}"`,
          '7e7b042d-417d-4398-bbd7-0c6bb19898f6',
          { parameters },
          exc,
        );

        throw exc;
      }
    });

    return requestedAcrValues;
  }

  /**
   * Checks and returns the Claims requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client requesting Authorization.
   * @returns Claims requested by the Client.
   */
  protected getClaims(parameters: AuthorizationRequest, client: Client): Nullable<AuthorizationRequestClaimsParameter> {
    this.logger.debug(`[${this.constructor.name}] Called getClaims()`, '98edab77-17e7-4c15-8984-de1880e08435', {
      parameters,
      client,
    });

    if (typeof this.claimsHandler === 'undefined' || typeof parameters.claims === 'undefined') {
      return null;
    }

    return this.claimsHandler.checkRequestedClaims(parameters.claims);
  }

  /**
   * Checks the **offline_access** Scope conditions for the Authorization Request.
   *
   * @param scopes Scopes requested by the Client.
   * @param prompts Prompts requested by the Client.
   * @param responseType Response Type requested by the Client.
   * @returns Allowed Scopes after checking for Offline Access conditions.
   */
  protected checkOfflineAccessScope(
    scopes: string[],
    prompts: Prompt[],
    responseType: ResponseTypeInterface,
  ): string[] {
    this.logger.debug(
      `[${this.constructor.name}] Called checkOfflineAccessScope()`,
      '260f1547-beeb-4b21-adc9-59273d5a5eed',
      { scopes, prompts, response_type: responseType.name },
    );

    if (scopes.includes('offline_access') && (!prompts.includes('consent') || !responseType.name.includes('code'))) {
      this.logger.debug(
        `[${this.constructor.name}] Removing "offline_access" scope`,
        '72b2b93c-21bb-449c-a032-dfde4ecfd007',
      );

      scopes = scopes.filter((scope) => scope !== 'offline_access');
    }

    return scopes;
  }
}
