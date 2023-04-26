import { Inject, Injectable } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { AccessToken } from '../entities/access-token.entity';
import { InsufficientScopeException } from '../exceptions/insufficient-scope.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { ClientAuthorizationHandler } from '../handlers/client-authorization.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Userinfo** Endpoint.
 *
 * This endpoint is used by the Client to retrieve claims about the End User represented by the provided Access Token.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#UserInfo
 */
@Injectable()
export class UserinfoEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'userinfo';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/userinfo';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['GET', 'POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Userinfo Endpoint.
   *
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface
  ) {
    if (typeof this.userService.getUserinfo !== 'function') {
      throw new TypeError('Missing implementation of required method "UserServiceInterface.getUserinfo".');
    }
  }

  /**
   * Creates a Http JSON Access Token Response.
   *
   * This method is responsible for returning the claims about the End User represented by the provided Access Token.
   *
   * If the Access Token provided by the Client is invalid, expired, malformed or lacks the necessary scopes,
   * this method will return an error response with the parameters in the **WWW-Authenticate** header and the body.
   *
   * If the flow succeeds, the Client will then receive a JSON object containing the claims about the End User
   * based on the scopes granted to the Client at the Access Token.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    try {
      const { scopes, user } = await this.authorize(request);
      const claims = await this.userService.getUserinfo!(user!, scopes);

      return new HttpResponse().setHeaders(this.headers).json(claims);
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
   * Retrieves the Access Token from the Authorization Header and validates it.
   *
   * @param request Http Request.
   * @returns Access Token based on the handle provided by the Client.
   */
  private async authorize(request: HttpRequest): Promise<AccessToken> {
    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (!accessToken.scopes.includes('openid')) {
      throw new InsufficientScopeException({
        description: 'The provided Access Token is missing the required scope "openid".',
      });
    }

    if (accessToken.client == null) {
      throw new InvalidTokenException({ description: 'Invalid Credentials.' });
    }

    if (accessToken.user == null) {
      throw new InvalidTokenException({ description: 'Invalid Credentials.' });
    }

    return accessToken;
  }
}
