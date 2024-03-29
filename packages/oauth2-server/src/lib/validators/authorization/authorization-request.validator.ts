import { URL } from 'url';

import { Nullable } from '@guarani/types';

import { AuthorizationContext } from '../../context/authorization/authorization-context';
import { DisplayInterface } from '../../displays/display.interface';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidClientException } from '../../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { UnauthorizedClientException } from '../../exceptions/unauthorized-client.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { ResponseMode } from '../../response-modes/response-mode.type';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { ResponseType } from '../../response-types/response-type.type';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { Settings } from '../../settings/settings';
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
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   */
  public constructor(
    protected readonly scopeHandler: ScopeHandler,
    protected readonly settings: Settings,
    protected readonly clientService: ClientServiceInterface,
    protected readonly responseModes: ResponseModeInterface[],
    protected readonly responseTypes: ResponseTypeInterface[],
    protected readonly displays: DisplayInterface[],
  ) {}

  /**
   * Validates the Http Authorization Request and returns the actors of the Authorization Context.
   *
   * @param request Http Request.
   * @returns Authorization Context.
   */
  public async validate(request: HttpRequest): Promise<TContext> {
    const parameters = request.query as AuthorizationRequest;
    const cookies = request.cookies;

    const client = await this.getClient(parameters);
    const responseType = this.getResponseType(parameters, client);
    const redirectUri = this.getRedirectUri(parameters, client);
    const scopes = this.getScopes(parameters, client);
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

    return <TContext>{
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
    };
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Client based on the provided Client Identifier.
   */
  protected async getClient(parameters: AuthorizationRequest): Promise<Client> {
    if (typeof parameters.client_id === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "client_id".');
    }

    const client = await this.clientService.findOne(parameters.client_id);

    if (client === null) {
      throw new InvalidClientException('Invalid Client.');
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
    const name = parameters.response_type!.split(' ').sort().join(' ') as ResponseType;
    const responseType = this.responseTypes.find((responseType) => responseType.name === name)!;

    if (!client.responseTypes.includes(responseType.name)) {
      throw new UnauthorizedClientException(
        `This Client is not allowed to request the response_type "${responseType.name}".`,
      );
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
    if (typeof parameters.redirect_uri === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "redirect_uri".');
    }

    let redirectUri: URL;

    try {
      redirectUri = new URL(parameters.redirect_uri);
    } catch (exc: unknown) {
      throw new InvalidRequestException('Invalid parameter "redirect_uri".');
    }

    if (redirectUri.hash.length !== 0) {
      throw new InvalidRequestException('The Redirect URI MUST NOT have a fragment component.');
    }

    if (!client.redirectUris.includes(redirectUri.href)) {
      throw new AccessDeniedException('Invalid Redirect URI.');
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
    if (typeof parameters.scope === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "scope".');
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
    const responseModeName =
      parameters.response_mode === 'jwt'
        ? `${responseType.defaultResponseMode}.jwt`
        : parameters.response_mode ?? responseType.defaultResponseMode;

    const responseMode = this.responseModes.find((responseMode) => responseMode.name === responseModeName);

    if (typeof responseMode === 'undefined') {
      throw new InvalidRequestException(`Unsupported response_mode "${responseModeName}".`);
    }

    const jwtResponseModes: ResponseMode[] = ['form_post.jwt', 'fragment.jwt', 'jwt', 'query.jwt'];

    if (jwtResponseModes.includes(responseMode.name) && client.authorizationSignedResponseAlgorithm === null) {
      throw new InvalidRequestException(
        `This Client is not allowed to request the Response Mode "${responseModeName}".`,
      );
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
    return parameters.nonce ?? null;
  }

  /**
   * Returns the Prompts requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Prompts requested by the Client.
   */
  protected getPrompts(parameters: AuthorizationRequest): Prompt[] {
    const requestedPrompts = (parameters.prompt?.split(' ') ?? []) as Prompt[];
    const supportedPromptsNames: Prompt[] = ['consent', 'create', 'login', 'none', 'select_account'];

    requestedPrompts.forEach((prompt) => {
      if (!supportedPromptsNames.includes(prompt)) {
        throw new InvalidRequestException(`Unsupported prompt "${prompt}".`);
      }
    });

    if (requestedPrompts.includes('none') && requestedPrompts.length !== 1) {
      throw new InvalidRequestException('The prompt "none" must be used by itself.');
    }

    if (requestedPrompts.includes('create') && requestedPrompts.includes('login')) {
      throw new InvalidRequestException('The prompts "create" and "login" cannot be used together.');
    }

    if (requestedPrompts.includes('create') && requestedPrompts.includes('select_account')) {
      throw new InvalidRequestException('The prompts "create" and "select_account" cannot be used together.');
    }

    if (requestedPrompts.includes('login') && requestedPrompts.includes('select_account')) {
      throw new InvalidRequestException('The prompts "login" and "select_account" cannot be used together.');
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
    const displayName = parameters.display ?? 'page';
    const display = this.displays.find((display) => display.name === displayName);

    if (typeof display === 'undefined') {
      throw new InvalidRequestException(`Unsupported display "${displayName}".`);
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
    if (typeof parameters.max_age === 'undefined') {
      return null;
    }

    if (!/^(0|[1-9]\d*)$/g.test(parameters.max_age)) {
      throw new InvalidRequestException('Invalid parameter "max_age".');
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
    return parameters.login_hint ?? null;
  }

  /**
   * Checks and returns the ID Token Hint provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns ID Token Hint provided by the Client.
   */
  protected getIdTokenHint(parameters: AuthorizationRequest): Nullable<string> {
    return parameters.id_token_hint ?? null;
  }

  /**
   * Checks and returns the UI Locales requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns UI Locales requested by the Client.
   */
  protected getUiLocales(parameters: AuthorizationRequest): string[] {
    const requestedUiLocales = parameters.ui_locales?.split(' ') ?? [];

    requestedUiLocales.forEach((requestedUiLocale) => {
      if (!this.settings.uiLocales.includes(requestedUiLocale)) {
        throw new InvalidRequestException(`Unsupported UI Locale "${requestedUiLocale}".`);
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
    const requestedAcrValues = parameters.acr_values?.split(' ') ?? [];

    requestedAcrValues.forEach((requestedAcrValue) => {
      if (!this.settings.acrValues.includes(requestedAcrValue)) {
        throw new InvalidRequestException(`Unsupported Authentication Context Class Reference "${requestedAcrValue}".`);
      }
    });

    return requestedAcrValues;
  }
}
