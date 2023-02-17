import { Inject, Injectable } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { DeviceAuthorizationRequest } from '../messages/device-authorization-request';
import { DeviceAuthorizationResponse } from '../messages/device-authorization-response';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Device Authorization** Endpoint.
 *
 * This endpoint is used to provide an Device Code for the requesting Client.
 *
 * The Client then displays this Device Code to the End User along with a Url to a Device Endpoint where it will be
 * exchanged into an Access Token to be returned to the Device for authorized use.
 *
 * @see https://www.rfc-editor.org/rfc/rfc8628.html#section-3.1
 * @see https://www.rfc-editor.org/rfc/rfc8628.html#section-3.2
 */
@Injectable()
export class DeviceAuthorizationEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  readonly name: Endpoint = 'device_authorization';

  /**
   * Path of the Endpoint.
   */
  readonly path: string = '/oauth/device_authorization';

  /**
   * Http Methods supported by the Endpoint.
   */
  readonly httpMethods: HttpMethod[] = ['POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Device Authorization Endpoint.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   * @param deviceCodeService Instance of the Device Code Service.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    private readonly scopeHandler: ScopeHandler,
    @Inject(DEVICE_CODE_SERVICE) private readonly deviceCodeService: DeviceCodeServiceInterface,
    @Inject(SETTINGS) private readonly settings: Settings
  ) {}

  /**
   * Creates a Http Device Authorization Response.
   *
   * This method is responsible for issuing **Device Codes** back to the Device Client, which will be displayed back to
   * the End User, together with a Url for a Device Endpoint. The End User will access this Device Endpoint and input
   * the Device Code presented by the Device Client, and will proceed with the authentication and authorization
   * process as usual.
   *
   * Once authorized, the Device Endpoint will craft a request to the Token Endpoint, which will proceed with the
   * authorization process as the Device Grant.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <DeviceAuthorizationRequest>request.body;

    try {
      const client = await this.clientAuthenticationHandler.authenticate(request);

      this.checkClientScope(client, parameters.scope);

      const scopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);

      const deviceCode = await this.deviceCodeService.create(scopes, client);

      const deviceAuthorizationResponse: DeviceAuthorizationResponse = {
        device_code: deviceCode.id,
        user_code: deviceCode.userCode,
        verification_uri: deviceCode.verificationUri,
        verification_uri_complete: deviceCode.verificationUriComplete,
        expires_in: Math.ceil((deviceCode.expiresAt.getTime() - Date.now()) / 1000),
        interval: this.settings.devicePollingInterval,
      };

      return new HttpResponse().setHeaders(this.headers).json(deviceAuthorizationResponse);
    } catch (exc: unknown) {
      let error: OAuth2Exception;

      if (exc instanceof OAuth2Exception) {
        error = exc;
      } else {
        error = new ServerErrorException({ description: 'An unexpected error occurred.' });
        error.cause = exc;
      }

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }

  /**
   * Checks if the provided scope is supported by the Authorization Server and if the Client is allowed to request it.
   *
   * @param client Client of the Request.
   * @param scope Scope requested by the Client.
   */
  private checkClientScope(client: Client, scope: string | undefined): void {
    this.scopeHandler.checkRequestedScope(scope);

    scope?.split(' ').forEach((requestedScope) => {
      if (!client.scopes.includes(requestedScope)) {
        throw new AccessDeniedException({
          description: `The Client is not allowed to request the scope "${requestedScope}".`,
        });
      }
    });
  }
}
