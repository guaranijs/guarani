import { getContainer, Inject, Injectable, InjectAll } from '@guarani/ioc';

import { URL } from 'url';

import { Client } from '../entities/client';
import { User } from '../entities/user';
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
import { ClientService } from '../services/client.service';
import { getAllowedScopes } from '../utils';
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
   * Instance of the Client Service.
   */
  private readonly clientService: ClientService;

  /**
   * Response Types registered at the Authorization Server.
   */
  private readonly responseTypes: ResponseType[];

  /**
   * Response Modes registered at the Authorization Server.
   */
  private readonly responseModes: ResponseMode[];

  /**
   * Instantiates a new Authorization Endpoint.
   *
   * @param clientService Instance of the Client Service.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param responseModes Response Modes registered at the Authorization Server.
   */
  public constructor(
    @Inject('ClientService') clientService: ClientService,
    @InjectAll('ResponseType') responseTypes: ResponseType[],
    @InjectAll('ResponseMode') responseModes: ResponseMode[]
  ) {
    this.clientService = clientService;
    this.responseTypes = responseTypes;
    this.responseModes = responseModes;
  }

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

    const scopes = getAllowedScopes(client, params.scope);

    return { client, scopes };
  }

  /**
   * Creates a HTTP Redirect Authorization Response.
   *
   * Any error is safely redirected to the Redirect URI provided by the Client in the Authorization Request,
   * or to the Authorization Server's Error Endpoint, if the error should not be returned to the Client's Redirect URI.
   *
   * If the authorization flow of the grant results in a successful response, it will redirect the User-Agent
   * to the Redirect URI provided by the Client.
   *
   * This method **REQUIRES** consent given by the User, be it implicit or explicit.
   *
   * The means of which the application obtains the consent of the User has to be defined in the Framework Integration,
   * since it usually requires a redirection to an endpoint that is not supported by OAuth 2.0.
   *
   * If this method is hit, it assumes that the User has given consent to whatever scopes were requested by the Client.
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
      const user = this.getUser(request);
      const authorizationResponse = await responseType.createAuthorizationResponse(request, client, user);

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
    const client = await this.clientService.findClient(clientId);

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

  /**
   * Returns the End User of the Request if Consent was given.
   *
   * @param request HTTP Request.
   * @returns End User.
   */
  private getUser(request: Request): User {
    const { user } = request;

    if (user === undefined) {
      throw new AccessDeniedException({ error_description: 'Authorization denied by the End User.' });
    }

    return user;
  }
}
