import { getContainer, Inject, Injectable, InjectAll } from '@guarani/ioc';

import { URL } from 'url';

import { Adapter } from '../adapter';
import { Client } from '../entities/client';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedResponseTypeException } from '../exceptions/unsupported-response-type.exception';
import { Request } from '../http/request';
import { Response } from '../http/response';
import { ResponseMode } from '../response-modes/response-mode';
import { SupportedResponseMode } from '../response-modes/types/supported-response-mode';
import { ResponseType } from '../response-types/response-type';
import { AuthorizationParameters } from '../response-types/types/authorization.parameters';
import { SupportedResponseType } from '../response-types/types/supported-response-type';
import { checkRequestedScope } from '../utils';
import { Endpoint } from './endpoint';
import { ConsentParameters } from './types/consent.parameters';
import { SupportedEndpoint } from './types/supported-endpoint';

/**
 * Endpoint used to provide an Authorization Grant for the requesting Client on behalf of the End User.
 *
 * Since the OAuth 2.0 Spec does not define the need for authentication when using this endpoint, it is left omitted.
 */
@Injectable()
export class AuthorizationEndpoint implements Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: SupportedEndpoint = 'authorization';

  /**
   * Instantiates a new Authorization Endpoint.
   *
   * @param adapter Instance of the Adapter.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param responseModes Response Modes registered at the Authorization Server.
   */
  public constructor(
    @Inject('Adapter') private readonly adapter: Adapter,
    @InjectAll('ResponseType') private readonly responseTypes: ResponseType[],
    @InjectAll('ResponseMode') private readonly responseModes: ResponseMode[]
  ) {}

  /**
   * Error Endpoint of the Authorization Server.
   */
  private get errorUrl(): string {
    try {
      return getContainer('oauth2').resolve<string>('ErrorUrl');
    } catch {
      throw new TypeError('Missing required metadata "errorUrl" for the Authorization Endpoint.');
    }
  }

  /**
   * Returns the Parameters to be used by the application to create the Consent Screen.
   *
   * @param request HTTP Request.
   * @returns Parameters of the Consent Screen.
   */
  public async getConsentParams(request: Request): Promise<ConsentParameters> {
    const params = <AuthorizationParameters>request.data;

    this.checkParameters(params);

    const client = await this.getClient(params.client_id);
    const responseType = this.getResponseType(params.response_type);

    this.checkClientResponseType(client, responseType);
    this.checkClientRedirectUri(client, params.redirect_uri);

    const scopes = checkRequestedScope(client, params.scope);

    return { client, scopes };
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
  public async handle(request: Request): Promise<Response> {
    const params = <AuthorizationParameters>request.data;

    let client: Client;
    let responseType: ResponseType;
    let responseMode: ResponseMode;

    try {
      this.checkParameters(params);

      client = await this.getClient(params.client_id);
      responseType = this.getResponseType(params.response_type);

      this.checkClientResponseType(client, responseType);
      this.checkClientRedirectUri(client, params.redirect_uri);

      responseMode = this.getResponseMode(params.response_mode ?? responseType.defaultResponseMode);
    } catch (exc: any) {
      const error = exc instanceof OAuth2Exception ? exc : new ServerErrorException({ error_description: exc.message });
      return this.handleFatalAuthorizationError(error);
    }

    try {
      if (request.user === undefined) {
        const scopes = checkRequestedScope(client, params.scope);

        // TODO: Check if this should be a render or a redirect.
        return this.adapter.render('consent', { client, scopes, state: params.state });
      }

      if (request.user === null) {
        throw new AccessDeniedException({ error_description: 'Authorization denied by the End User.' });
      }

      const authorizationResponse = await responseType.createAuthorizationResponse(params, client, request.user);

      return responseMode.createHttpResponse(params.redirect_uri, authorizationResponse);
    } catch (exc: any) {
      const error = exc instanceof OAuth2Exception ? exc : new ServerErrorException({ error_description: exc.message });
      return responseMode.createHttpResponse(params.redirect_uri, error.toJSON());
    }
  }

  /**
   * Handles a fatal OAuth 2.0 Authorization Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Endpoint instead of the Client's Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @returns HTTP Response.
   */
  public handleFatalAuthorizationError(error: OAuth2Exception): Response {
    const url = new URL(this.errorUrl);
    Object.entries(error.toJSON()).forEach(([parameter, value]) => url.searchParams.set(parameter, value));
    return new Response().redirect(url.href);
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param params Parameters of the Authorization Request.
   */
  private checkParameters(params: AuthorizationParameters): void {
    const { response_type, client_id, redirect_uri, scope } = params;

    if (typeof response_type !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "response_type".' });
    }

    if (typeof client_id !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "client_id".' });
    }

    if (typeof redirect_uri !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "redirect_uri".' });
    }

    if (typeof scope !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "scope".' });
    }
  }

  /**
   * Fetches a Client from the application's storage based on the provided Client Identifier.
   *
   * @param clientId Identifier of the Client.
   * @returns Client based on the provided Client Identifier.
   */
  private async getClient(clientId: string): Promise<Client> {
    const client = await this.adapter.findClient(clientId);

    if (client === null) {
      throw new InvalidClientException({ error_description: 'Invalid Client.' });
    }

    return client;
  }

  /**
   * Retrieves the Response Type based on the **response_type** requested by the Client.
   *
   * @param name Response Type requested by the Client.
   * @returns Response Type.
   */
  private getResponseType(name: SupportedResponseType): ResponseType {
    const responseType = this.responseTypes.find((responseType) => responseType.name === name);

    if (responseType === undefined) {
      throw new UnsupportedResponseTypeException({ error_description: `Unsupported response_type "${name}".` });
    }

    return responseType;
  }

  /**
   * Checks if the Client is allowed to use the requested Response Type.
   *
   * @param client Client of the Request.
   * @param responseType Response Type requested by the Client.
   */
  private checkClientResponseType(client: Client, responseType: ResponseType): void {
    if (!client.responseTypes.includes(responseType.name)) {
      throw new UnauthorizedClientException({
        error_description: `This Client is not allowed to request the response_type "${responseType.name}".`,
      });
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
      throw new AccessDeniedException({ error_description: 'Invalid Redirect URI.' });
    }
  }

  /**
   * Retrieves the Response Mode based on the **response_mode** requested by the Client.
   *
   * @param name Response Mode requested by the Client.
   * @returns Response Mode.
   */
  private getResponseMode(name: SupportedResponseMode): ResponseMode {
    const responseMode = this.responseModes.find((responseMode) => responseMode.name === name);

    if (responseMode === undefined) {
      throw new InvalidRequestException({ error_description: `Unsupported response_mode "${name}".` });
    }

    return responseMode;
  }
}
