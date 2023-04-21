import { Inject, Injectable } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { ClientAuthorizationInterface } from './client-authorization.interface';
import { ClientAuthorization } from './client-authorization.type';

/**
 * Parameters passed by the Client on the Http Request Body.
 */
interface FormEncodedBodyCredentials {
  /**
   * Access Token Handle.
   */
  readonly access_token: string;
}

/**
 * Implements the Client Authorization via the Request Body.
 *
 * If this workflow is enabled, it will look at the Request Body for a scheme similar to the following:
 *
 * ```rst
 *     access_token=access_token
 * ```
 *
 * The Request Body often comes with more information that may pertain to a specific Endpoint.
 * In this case, the Request Body will be similar to the following:
 *
 * ```rst
 *     key1=value1&key2=value2&access_token=access_token
 * ```
 */
@Injectable()
export class FormEncodedBodyClientAuthorization implements ClientAuthorizationInterface {
  /**
   * Name of the Client Authorization Method.
   */
  public readonly name: ClientAuthorization = 'form_encoded_body';

  /**
   * Instantiates a new Form Encoded Body Client Authorization.
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
    const { access_token: accessTokenHandle } = <FormEncodedBodyCredentials>request.body;
    return request.method === 'POST' && typeof accessTokenHandle === 'string';
  }

  /**
   * Checks and returns the Access Token requested by the Client.
   *
   * @param request Http Request.
   * @returns Access Token based on the provided Access Token Handle.
   */
  public async authorize(request: HttpRequest): Promise<AccessToken> {
    const { access_token: accessTokenHandle } = <FormEncodedBodyCredentials>request.body;

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
