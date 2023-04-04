import { Inject, Injectable, InjectAll } from '@guarani/di';

import { URL, URLSearchParams } from 'url';

import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { InteractionHandler } from '../handlers/interaction.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { AuthorizationRequest } from '../messages/authorization-request';
import { Prompt } from '../prompts/prompt.type';
import { ResponseModeInterface } from '../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../response-modes/response-mode.token';
import { ResponseMode } from '../response-modes/response-mode.type';
import { ResponseTypeInterface } from '../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../response-types/response-type.token';
import { ResponseType } from '../response-types/response-type.type';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
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
   * Instantiates a new Authorization Endpoint.
   *
   * @param scopeHandler Instance of the Scope Handler.
   * @param interactionHandler Instance of the Interaction Handler.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param grantService Instance of the Grant Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    private readonly interactionHandler: InteractionHandler,
    @InjectAll(RESPONSE_TYPE) private readonly responseTypes: ResponseTypeInterface[],
    @InjectAll(RESPONSE_MODE) private readonly responseModes: ResponseModeInterface[],
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface
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
  public async handle(request: HttpRequest<AuthorizationRequest>): Promise<HttpResponse> {
    const { cookies, data: parameters } = request;

    let client: Client;
    let responseType: ResponseTypeInterface;
    let responseMode: ResponseModeInterface;
    let prompts: Prompt[];

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

      prompts = this.getPrompts(parameters.prompt, parameters.state);
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      return this.handleFatalAuthorizationError(error);
    }

    const entitiesOrInteractionResponse = await this.interactionHandler.getEntitiesOrHttpResponse(
      parameters,
      cookies,
      client,
      prompts
    );

    if (entitiesOrInteractionResponse instanceof HttpResponse) {
      return entitiesOrInteractionResponse;
    }

    const [grant, session, consent] = entitiesOrInteractionResponse;

    try {
      const authorizationResponse = await responseType.handle(parameters, session, consent);

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
      const error = this.asOAuth2Exception(exc, parameters);
      return responseMode.createHttpResponse(parameters.redirect_uri, error.toJSON());
    }
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: AuthorizationRequest): void {
    const {
      display,
      max_age: maxAge,
      nonce,
      prompt,
      response_mode: responseMode,
      response_type: responseType,
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
    } = parameters;

    if (state !== undefined && typeof state !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "state".' });
    }

    if (typeof responseType !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "response_type".', state });
    }

    if (typeof clientId !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "client_id".', state });
    }

    if (typeof redirectUri !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "redirect_uri".', state });
    }

    if (typeof scope !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "scope".', state });
    }

    if (responseMode !== undefined && typeof responseMode !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "response_mode".', state });
    }

    if (nonce !== undefined && typeof nonce !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "nonce".', state });
    }

    if (prompt !== undefined && typeof prompt !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "prompt".', state });
    }

    if (display !== undefined && typeof display !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "display".', state });
    }

    if (
      maxAge !== undefined &&
      typeof maxAge !== 'number' &&
      (typeof maxAge !== 'string' || Number.isNaN(Number.parseInt(maxAge, 10)))
    ) {
      throw new InvalidRequestException({ description: 'Invalid parameter "max_age".', state });
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
    name = <ResponseType>name.split(' ').sort().join(' ');

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
   * Returns a list of the Prompts requested by the Client.
   *
   * @param prompt Prompts requested by the Client.
   * @param state Client State prior to the Authorization Request.
   * @returns Parsed Prompt values.
   */
  private getPrompts(prompt: string | undefined, state: string | undefined): Prompt[] {
    const supportedPrompts: Prompt[] = ['consent', 'login', 'none'];
    const prompts = <Prompt[]>(prompt?.split(' ') ?? []);

    prompts.forEach((prompt) => {
      if (!supportedPrompts.includes(prompt)) {
        throw new InvalidRequestException({ description: `Unsupported prompt "${prompt}".`, state });
      }
    });

    if (prompts.includes('none') && prompts.length !== 1) {
      throw new InvalidRequestException({ description: 'The prompt "none" must be used by itself.', state });
    }

    return prompts;
  }

  /**
   * Handles a fatal OAuth 2.0 Authorization Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @returns Http Response.
   */
  private handleFatalAuthorizationError(error: OAuth2Exception): HttpResponse {
    const { issuer, userInteraction } = this.settings;

    const url = new URL(userInteraction!.errorUrl, issuer);
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
