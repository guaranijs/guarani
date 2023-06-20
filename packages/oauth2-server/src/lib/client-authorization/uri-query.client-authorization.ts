import { Inject, Injectable } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientAuthorizationInterface } from './client-authorization.interface';
import { ClientAuthorization } from './client-authorization.type';
import { UriQueryClientAuthorizationParameters } from './uri-query.client-authorization.parameters';

/**
 * Implements the Client Authorization via the Request Uri Query.
 *
 * If this workflow is enabled, it will look at the Request Uri Query for a scheme similar to the following:
 *
 * ```rst
 *     https://resource-server.example.com/protected-resource?access_token=access_token
 * ```
 *
 * The Request Uri Query often comes with more information that may pertain to a specific Endpoint.
 * In this case, the Request Uri Query will be similar to the following:
 *
 * ```rst
 *     https://resource-server.example.com/protected-resource?key1=value1&key2=value2&access_token=access_token
 * ```
 */
@Injectable()
export class UriQueryClientAuthorization implements ClientAuthorizationInterface {
  /**
   * Name of the Client Authorization Method.
   */
  public readonly name: ClientAuthorization = 'uri_query';

  /**
   * Instantiates a new URI Query Client Authorization.
   *
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(@Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface) {}

  /**
   * Checks if the Client Authorization Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  public hasBeenRequested(request: HttpRequest): boolean {
    if (request.method !== 'GET') {
      return false;
    }

    const parameters = request.query as UriQueryClientAuthorizationParameters;
    return typeof parameters.access_token === 'string';
  }

  /**
   * Checks and returns the Access Token requested by the Client.
   *
   * @param request Http Request.
   * @returns Access Token based on the provided Access Token Handle.
   */
  public async authorize(request: HttpRequest): Promise<AccessToken> {
    const { access_token: accessTokenHandle } = request.query as UriQueryClientAuthorizationParameters;

    const accessToken = await this.accessTokenService.findOne(accessTokenHandle);

    if (accessToken === null) {
      throw new InvalidTokenException('Invalid Access Token.');
    }

    if (new Date() > accessToken.expiresAt) {
      throw new InvalidTokenException('Expired Access Token.');
    }

    if (new Date() < accessToken.validAfter) {
      throw new InvalidTokenException('The provided Access Token is not yet valid.');
    }

    if (accessToken.isRevoked) {
      throw new InvalidTokenException('Revoked Access Token.');
    }

    return accessToken;
  }
}
