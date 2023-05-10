import { Inject, Injectable } from '@guarani/di';

import { URL, URLSearchParams } from 'url';

import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { EndSessionRequest } from '../requests/end-session-request';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndSessionRequestValidator } from '../validators/end-session-request.validator';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **End Session** Endpoint.
 *
 * This endpoint is used to remove a Login from the Session of the User-Agent.
 *
 * @see https://openid.net/specs/openid-connect-rpinitiated-1_0.html
 */
@Injectable()
export class EndSessionEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'end_session';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/end_session';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET', 'POST'];

  /**
   * Instantiates a new End Session Endpoint.
   *
   * @param validator Instance of the End Session Request Validator.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly validator: EndSessionRequestValidator,
    @Inject(SETTINGS) private readonly settings: Settings
  ) {
    if (typeof this.settings.userInteraction === 'undefined') {
      throw new TypeError('Missing User Interaction options.');
    }
  }

  /**
   * Creates a Http Redirect End Session Response.
   *
   * This method is responsible for removing the **Current Active Login** from the User-Agent's Session.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = this.validator.getEndSessionParameters(request);

    try {
      const context = await this.validator.validate(request);
      return new HttpResponse().json({ message: 'End Session Endpoint.', parameters: context.parameters });
    } catch (exc: unknown) {
      const error = this.asOAuth2Exception(exc, parameters);
      return this.handleFatalEndSessionError(error);
    }
  }

  /**
   * Treats the caught exception into a valid OAuth 2.0 Exception.
   *
   * @param exc Exception caught.
   * @param parameters Parameters of the End Session Request.
   * @returns Treated OAuth 2.0 Exception.
   */
  private asOAuth2Exception(exc: unknown, parameters: EndSessionRequest): OAuth2Exception {
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

  /**
   * Handles a fatal OAuth 2.0 End Session Error - that is, an error that has to be redirected
   * to the Authorization Server's Error Page instead of the Client's Post Logout Redirect URI.
   *
   * @param error OAuth 2.0 Exception.
   * @returns Http Response.
   */
  private handleFatalEndSessionError(error: OAuth2Exception): HttpResponse {
    const url = new URL(this.settings.userInteraction!.errorUrl, this.settings.issuer);
    const parameters = new URLSearchParams(error.toJSON());

    url.search = parameters.toString();

    return new HttpResponse().redirect(url.href);
  }
}
