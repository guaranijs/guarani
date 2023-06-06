import { Inject, Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { OutgoingHttpHeaders } from 'http';

import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { DeviceAuthorizationResponse } from '../responses/device-authorization-response';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { DeviceAuthorizationRequestValidator } from '../validators/device-authorization-request.validator';
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
  readonly path: string = '/oauth/device-authorization';

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
   * @param validator Instance of the Device Authorization Request Validator.
   * @param deviceCodeService Instance of the Device Code Service.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly validator: DeviceAuthorizationRequestValidator,
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
    try {
      const { client, scopes } = await this.validator.validate(request);
      const deviceCode = await this.deviceCodeService.create(scopes, client);

      const deviceAuthorizationResponse = removeNullishValues<DeviceAuthorizationResponse>({
        device_code: deviceCode.id,
        user_code: deviceCode.userCode,
        verification_uri: deviceCode.verificationUri,
        verification_uri_complete: deviceCode.verificationUriComplete ?? undefined,
        expires_in: Math.ceil((deviceCode.expiresAt.getTime() - Date.now()) / 1000),
        interval: this.settings.devicePollingInterval,
      });

      return new HttpResponse().setHeaders(this.headers).json(deviceAuthorizationResponse);
    } catch (exc: unknown) {
      const error =
        exc instanceof OAuth2Exception
          ? exc
          : new ServerErrorException('An unexpected error occurred.', { cause: exc });

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }
}
