import { Inject, Injectable, InjectAll } from '@guarani/di';

import { URL, URLSearchParams } from 'url';

import { AuthorizationServerOptions } from '../authorization-server/options/authorization-server.options';
import { Client } from '../entities/client';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { AuthorizationParameters } from '../models/authorization-parameters';
import { IResponseMode } from '../response-modes/response-mode.interface';
import { IResponseType } from '../response-types/response-type.interface';
import { IClientService } from '../services/client.service.interface';
import { Endpoint } from '../types/endpoint';
import { HttpMethod } from '../types/http-method';
import { ResponseMode } from '../types/response-mode';
import { ResponseType } from '../types/response-type';
import { IEndpoint } from './endpoint.interface';

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
export class AuthorizationEndpoint implements IEndpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'authorization';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/authorize';

  /**
   * HTTP Methods of the Endpoint.
   */
  public readonly methods: HttpMethod[] = ['get'];

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
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param authorizationServerOptions Configuration Parameters of the Authorization Server.
   */
  public constructor(
    @InjectAll('ResponseType') private readonly responseTypes: IResponseType[],
    @InjectAll('ResponseMode') private readonly responseModes: IResponseMode[],
    @Inject('ClientService') private readonly clientService: IClientService,
    private readonly scopeHandler: ScopeHandler,
    @Inject('AuthorizationServerOptions') private readonly authorizationServerOptions: AuthorizationServerOptions
  ) {
    if (this.authorizationServerOptions.userInteraction === undefined) {
      throw new TypeError('Missing User Interaction options.');
    }

    const {
      issuer,
      userInteraction: { errorUrl, loginUrl },
    } = this.authorizationServerOptions;

    this.errorUrl = new URL(errorUrl, issuer).href;
    this.loginUrl = new URL(loginUrl, issuer).href;
  }

  /**
   * Creates a HTTP Redirect Authorization Response.
   *
   * Any error is safely redirected to the Redirect URI provided by the Client in the Authorization Request,
   * or to the Authorization Server's Error Endpoint, should the error not be returned to the Client's Redirect URI.
   *
   * If the authorization flow of the grant results in a successful response, it will redirect the User-Agent
   * to the Redirect URI provided by the Client.
   *
   * This method **REQUIRES** consent given by the User, be it implicit or explicit.
   * The means of which the application obtains the consent of the User has to be defined by the application.
   *
   * @param request HTTP Request.
   * @returns HTTP Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = this.getParameters(request);

    let client: Client;
    let responseType: IResponseType;
    let responseMode: IResponseMode;

    try {
      this.checkParameters(parameters);

      client = await this.getClient(parameters.client_id);
      responseType = this.getResponseType(parameters.response_type);

      this.checkClientResponseType(client, responseType);
      this.checkClientRedirectUri(client, parameters.redirect_uri);

      this.scopeHandler.checkRequestedScope(parameters.scope);

      responseMode = this.getResponseMode(parameters.response_mode ?? responseType.defaultResponseMode);
    } catch (exc: any) {
      const error = exc instanceof OAuth2Exception ? exc : new ServerErrorException(exc.message);
      return this.handleFatalAuthorizationError(error);
    }

    try {
      if (request.user === undefined) {
        return this.redirectToLoginPage(parameters);
      }

      // TODO: add consent page.
      const authorizationResponse = await responseType.handle(parameters, client, request.user);

      return responseMode.createHttpResponse(parameters.redirect_uri, authorizationResponse);
    } catch (exc: any) {
      const error = exc instanceof OAuth2Exception ? exc : new ServerErrorException(exc.message);
      return responseMode.createHttpResponse(parameters.redirect_uri, error.toJSON());
    }
  }

  /**
   * Parses the HTTP Request for the Authorization Parameters based on the HTTP Method.
   *
   * @param request HTTP Request.
   * @returns Parameters of the Authorization Request.
   */
  private getParameters(request: HttpRequest): AuthorizationParameters {
    switch (request.method) {
      case 'get':
        return <AuthorizationParameters>request.query;

      case 'post':
        return <AuthorizationParameters>request.body;

      default:
        throw new TypeError(`Invalid HTTP Method "${request.method}" for the Authorization Endpoint.`);
    }
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: AuthorizationParameters): void {
    const { response_type, client_id, redirect_uri, scope } = parameters;

    if (typeof response_type !== 'string') {
      throw new InvalidRequestException('Invalid parameter "response_type".');
    }

    if (typeof client_id !== 'string') {
      throw new InvalidRequestException('Invalid parameter "client_id".');
    }

    if (typeof redirect_uri !== 'string') {
      throw new InvalidRequestException('Invalid parameter "redirect_uri".');
    }

    if (typeof scope !== 'string') {
      throw new InvalidRequestException('Invalid parameter "scope".');
    }
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param clientId Identifier of the Client.
   * @returns Client based on the provided Client Identifier.
   */
  private async getClient(clientId: string): Promise<Client> {
    const client = await this.clientService.findClient(clientId);

    if (client === undefined) {
      throw new InvalidClientException('Invalid Client.');
    }

    return client;
  }

  /**
   * Retrieves the Response Type based on the **response_type** requested by the Client.
   *
   * @param name Response Type requested by the Client.
   * @returns Response Type.
   */
  private getResponseType(name: ResponseType): IResponseType {
    const responseType = this.responseTypes.find((responseType) => responseType.name === name);

    if (responseType === undefined) {
      throw new UnsupportedResponseTypeException(`Unsupported response_type "${name}".`);
    }

    return responseType;
  }

  /**
   * Checks if the Client is allowed to use the requested Response Type.
   *
   * @param client Client of the Request.
   * @param responseType Response Type requested by the Client.
   */
  private checkClientResponseType(client: Client, responseType: IResponseType): void {
    if (!client.responseTypes.includes(responseType.name)) {
      throw new UnauthorizedClientException(
        `This Client is not allowed to request the response_type "${responseType.name}".`
      );
    }
  }

  /**
   * Checks the provided Redirect URI against the registered Redirect URIs of the Client.
   *
   * @param client Client of the Request.
   * @param redirectUri Redirect URI provided by the Client.
   */
  private checkClientRedirectUri(client: Client, redirectUri: string): void {
    if (!client.redirectUris.includes(redirectUri)) {
      throw new AccessDeniedException('Invalid Redirect URI.');
    }
  }

  /**
   * Retrieves the Response Mode based on the **response_mode** requested by the Client.
   *
   * @param name Response Mode requested by the Client.
   * @returns Response Mode.
   */
  private getResponseMode(name: ResponseMode): IResponseMode {
    const responseMode = this.responseModes.find((responseMode) => responseMode.name === name);

    if (responseMode === undefined) {
      throw new InvalidRequestException(`Unsupported response_mode "${name}".`);
    }

    return responseMode;
  }

  /**
   * Handles a fatal OAuth 2.0 Authorization Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @returns HTTP Response.
   */
  private handleFatalAuthorizationError(error: OAuth2Exception): HttpResponse {
    const url = new URL(this.errorUrl);
    const parameters = new URLSearchParams(error.toJSON());

    url.search = parameters.toString();

    return new HttpResponse().redirect(url.href);
  }

  /**
   * Redirects the User-Agent to the Authorization Server's Login Page for it to authenticate the User.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns HTTP Redirect Response to the Login Page.
   */
  private redirectToLoginPage(parameters: AuthorizationParameters): HttpResponse {
    const redirectToUrl = new URL(this.path, this.authorizationServerOptions.issuer);
    const redirectToSearchParams = new URLSearchParams(parameters);

    redirectToUrl.search = redirectToSearchParams.toString();

    const url = new URL(this.loginUrl);
    const searchParams = new URLSearchParams({ redirect_to: redirectToUrl.href });

    url.search = searchParams.toString();

    return new HttpResponse().redirect(url);
  }
}
