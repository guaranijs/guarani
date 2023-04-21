import { URL } from 'url';

import { AuthorizationContext } from '../../context/authorization/authorization.context';
import { DisplayInterface } from '../../displays/display.interface';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidClientException } from '../../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { UnauthorizedClientException } from '../../exceptions/unauthorized-client.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { PromptInterface } from '../../prompts/prompt.interface';
import { Prompt } from '../../prompts/prompt.type';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { ResponseType } from '../../response-types/response-type.type';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { Settings } from '../../settings/settings';

/**
 * Implementation of the Authorization Request Validator.
 */
export abstract class AuthorizationRequestValidator<
  TRequest extends AuthorizationRequest,
  TContext extends AuthorizationContext<TRequest>
> {
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
   * @param prompts Prompts registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   */
  public constructor(
    protected readonly scopeHandler: ScopeHandler,
    protected readonly settings: Settings,
    protected readonly clientService: ClientServiceInterface,
    protected readonly responseModes: ResponseModeInterface[],
    protected readonly responseTypes: ResponseTypeInterface[],
    protected readonly prompts: PromptInterface[],
    protected readonly displays: DisplayInterface[]
  ) {}

  /**
   * Validates the Http Authorization Request and returns the actors of the Authorization Context.
   *
   * @param request Http Request.
   * @returns Authorization Context.
   */
  public async validate(request: HttpRequest): Promise<TContext> {
    const parameters = <TRequest>request.query;
    const cookies = request.cookies;

    const state = this.getState(parameters);
    const client = await this.getClient(parameters);
    const responseType = this.getResponseType(parameters, client);
    const redirectUri = this.getRedirectUri(parameters, client);
    const scopes = this.getScopes(parameters, client);
    const responseMode = this.getResponseMode(parameters, responseType);
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
   * Checks and returns the State provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns State provided by the Client.
   */
  protected getState(parameters: AuthorizationRequest): string | undefined {
    if (parameters.state !== undefined && typeof parameters.state !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "state".' });
    }

    return parameters.state;
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Client based on the provided Client Identifier.
   */
  protected async getClient(parameters: AuthorizationRequest): Promise<Client> {
    if (typeof parameters.client_id !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "client_id".', state: parameters.state });
    }

    const client = await this.clientService.findOne(parameters.client_id);

    if (client === null) {
      throw new InvalidClientException({ description: 'Invalid Client.', state: parameters.state });
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
    const name = <ResponseType>parameters.response_type.split(' ').sort().join(' ');
    const responseType = this.responseTypes.find((responseType) => responseType.name === name)!;

    if (!client.responseTypes.includes(responseType.name)) {
      throw new UnauthorizedClientException({
        description: `This Client is not allowed to request the response_type "${responseType.name}".`,
        state: parameters.state,
      });
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
    if (typeof parameters.redirect_uri !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".', state: parameters.state });
    }

    let redirectUri: URL;

    try {
      redirectUri = new URL(parameters.redirect_uri);
    } catch (exc: unknown) {
      throw new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".', state: parameters.state });
    }

    if (redirectUri.hash.length !== 0) {
      throw new InvalidRequestException({
        description: 'The Redirect URI MUST NOT have a fragment component.',
        state: parameters.state,
      });
    }

    if (!client.redirectUris.includes(redirectUri.href)) {
      throw new AccessDeniedException({ description: 'Invalid Redirect URI.', state: parameters.state });
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
    if (typeof parameters.scope !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "scope".', state: parameters.state });
    }

    this.scopeHandler.checkRequestedScope(parameters.scope, parameters.state);

    parameters.scope.split(' ').forEach((requestedScope) => {
      if (!client.scopes.includes(requestedScope)) {
        throw new AccessDeniedException({
          description: `The Client is not allowed to request the scope "${requestedScope}".`,
          state: parameters.state,
        });
      }
    });

    return this.scopeHandler.getAllowedScopes(client, parameters.scope);
  }

  /**
   * Retrieves the Response Mode requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param responseType Response Type requested by the Client.
   * @returns Response Mode.
   */
  protected getResponseMode(
    parameters: AuthorizationRequest,
    responseType: ResponseTypeInterface
  ): ResponseModeInterface {
    if (parameters.response_mode !== undefined && typeof parameters.response_mode !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "response_mode".', state: parameters.state });
    }

    const responseModeName = parameters.response_mode ?? responseType.defaultResponseMode;
    const responseMode = this.responseModes.find((responseMode) => responseMode.name === responseModeName);

    if (responseMode === undefined) {
      throw new InvalidRequestException({
        description: `Unsupported response_mode "${responseModeName}".`,
        state: parameters.state,
      });
    }

    return responseMode;
  }

  /**
   * Checks and returns the Nonce provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Nonce provided by the Client.
   */
  protected getNonce(parameters: AuthorizationRequest): string | undefined {
    if (parameters.nonce !== undefined && typeof parameters.nonce !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "nonce".', state: parameters.state });
    }

    return parameters.nonce;
  }

  /**
   * Returns the Prompts requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Prompts requested by the Client.
   */
  protected getPrompts(parameters: AuthorizationRequest): PromptInterface[] {
    if (parameters.prompt !== undefined && typeof parameters.prompt !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "prompt".', state: parameters.state });
    }

    const requestedPrompts = <Prompt[]>(parameters.prompt?.split(' ') ?? []);
    const supportedPromptsNames = this.prompts.map((prompt) => prompt.name);

    requestedPrompts.forEach((prompt) => {
      if (!supportedPromptsNames.includes(prompt)) {
        throw new InvalidRequestException({ description: `Unsupported prompt "${prompt}".`, state: parameters.state });
      }
    });

    if (requestedPrompts.includes('none') && requestedPrompts.length !== 1) {
      throw new InvalidRequestException({
        description: 'The prompt "none" must be used by itself.',
        state: parameters.state,
      });
    }

    return this.prompts.filter((prompt) => requestedPrompts.includes(prompt.name));
  }

  /**
   * Retrieves the Display requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Display.
   */
  protected getDisplay(parameters: AuthorizationRequest): DisplayInterface {
    if (parameters.display !== undefined && typeof parameters.display !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "display".', state: parameters.state });
    }

    const displayName = parameters.display ?? 'page';
    const display = this.displays.find((display) => display.name === displayName);

    if (display === undefined) {
      throw new InvalidRequestException({
        description: `Unsupported display "${displayName}".`,
        state: parameters.state,
      });
    }

    return display;
  }

  /**
   * Checks and returns the parsed Max Age provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Parsed Max Age.
   */
  protected getMaxAge(parameters: AuthorizationRequest): number | undefined {
    if (parameters.max_age === undefined) {
      return undefined;
    }

    if (typeof parameters.max_age !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "max_age".', state: parameters.state });
    }

    if (!/^(0|[1-9]\d*)$/g.test(parameters.max_age)) {
      throw new InvalidRequestException({ description: 'Invalid parameter "max_age".', state: parameters.state });
    }

    return Number.parseInt(parameters.max_age, 10);
  }

  /**
   * Checks and returns the Login Hint provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Login Hint provided by the Client.
   */
  protected getLoginHint(parameters: AuthorizationRequest): string | undefined {
    if (parameters.login_hint !== undefined && typeof parameters.login_hint !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "login_hint".', state: parameters.state });
    }

    return parameters.login_hint;
  }

  /**
   * Checks and returns the ID Token Hint provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns ID Token Hint provided by the Client.
   */
  protected getIdTokenHint(parameters: AuthorizationRequest): string | undefined {
    if (parameters.id_token_hint !== undefined && typeof parameters.id_token_hint !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "id_token_hint".', state: parameters.state });
    }

    return parameters.id_token_hint;
  }

  /**
   * Checks and returns the UI Locales requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns UI Locales requested by the Client.
   */
  protected getUiLocales(parameters: AuthorizationRequest): string[] {
    if (parameters.ui_locales !== undefined && typeof parameters.ui_locales !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "ui_locales".', state: parameters.state });
    }

    const requestedUiLocales = parameters.ui_locales?.split(' ') ?? [];

    requestedUiLocales.forEach((requestedUiLocale) => {
      if (!this.settings.uiLocales.includes(requestedUiLocale)) {
        throw new InvalidRequestException({
          description: `Unsupported UI Locale "${requestedUiLocale}".`,
          state: parameters.state,
        });
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
    if (parameters.acr_values !== undefined && typeof parameters.acr_values !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "acr_values".', state: parameters.state });
    }

    const requestedAcrValues = parameters.acr_values?.split(' ') ?? [];

    requestedAcrValues.forEach((requestedAcrValue) => {
      if (!this.settings.acrValues.includes(requestedAcrValue)) {
        throw new InvalidRequestException({
          description: `Unsupported Authentication Context Class Reference "${requestedAcrValue}".`,
          state: parameters.state,
        });
      }
    });

    return requestedAcrValues;
  }
}
