import { Inject, Injectable } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientAuthorizationInterface } from './client-authorization.interface';
import { ClientAuthorization } from './client-authorization.type';

/**
 * Implements the Client Authorization via the Bearer Authorization Header.
 *
 * If this workflow is enabled, it will look at the Authorization header for a scheme similar to the following:
 *
 * ```rst
 *     Bearer access_token
 * ```
 *
 * This scheme denotes the type of the flow, which in this case is **Bearer**, and the Access Token,
 * a String that contains the Access Token Handle provided by the Client.
 */
@Injectable()
export class AuthorizationHeaderBearerClientAuthorization implements ClientAuthorizationInterface {
  /**
   * Name of the Client Authorization Method.
   */
  public readonly name: ClientAuthorization = 'authorization_header_bearer';

  /**
   * Instantiates a new Authorization Header Bearer Client Authorization.
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
    return request.headers.authorization?.startsWith('Bearer') === true;
  }

  /**
   * Checks and returns the Access Token requested by the Client.
   *
   * @param request Http Request.
   * @returns Access Token based on the provided Access Token Handle.
   */
  public async authorize(request: HttpRequest): Promise<AccessToken> {
    const { authorization } = request.headers;

    const [, accessTokenHandle] = authorization!.split(' ', 2);

    if (accessTokenHandle === undefined) {
      throw new InvalidRequestException({ description: 'Missing Bearer Token.' });
    }

    if (!/^[a-zA-Z0-9+/\-_.~=]+$/.test(accessTokenHandle)) {
      throw new InvalidTokenException({ description: 'Invalid Bearer Token.' });
    }

    const accessToken = await this.accessTokenService.findOne(accessTokenHandle);

    if (accessToken === null) {
      throw new InvalidTokenException({ description: 'Invalid Access Token.' });
    }

    if (new Date() > accessToken.expiresAt) {
      throw new InvalidTokenException({ description: 'Expired Access Token.' });
    }

    if (new Date() < accessToken.validAfter) {
      throw new InvalidTokenException({ description: 'The provided Access Token is not yet valid.' });
    }

    if (accessToken.isRevoked) {
      throw new InvalidTokenException({ description: 'Revoked Access Token.' });
    }

    return accessToken;
  }
}
