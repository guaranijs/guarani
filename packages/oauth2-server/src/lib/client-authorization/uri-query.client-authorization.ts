import { Inject, Injectable } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
  ) {}

  /**
   * Checks if the Client Authorization Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  public hasBeenRequested(request: HttpRequest): boolean {
    this.logger.debug(`[${this.constructor.name}] Called hasBeenRequested()`, '92bca20b-a2b1-4e3d-8c5f-9577ae0e8999', {
      request,
    });

    if (request.method !== 'GET') {
      this.logger.debug(
        `[${this.constructor.name}] Completed hasBeenRequested()`,
        '19fb007e-cc16-49bb-9630-e44d1b602f1d',
        { request, result: false },
      );

      return false;
    }

    const parameters = request.query as UriQueryClientAuthorizationParameters;

    const result = typeof parameters.access_token === 'string';

    this.logger.debug(
      `[${this.constructor.name}] Completed hasBeenRequested()`,
      '749d897f-51c0-4292-b334-8c6b7492fd1c',
      { request, result },
    );

    return result;
  }

  /**
   * Checks and returns the Access Token requested by the Client.
   *
   * @param request Http Request.
   * @returns Access Token based on the provided Access Token Handle.
   */
  public async authorize(request: HttpRequest): Promise<AccessToken> {
    this.logger.debug(`[${this.constructor.name}] Called authorize()`, '03720137-9bd3-4100-ac3b-8defdd86d943', {
      request,
    });

    const { access_token: accessTokenHandle } = request.query as UriQueryClientAuthorizationParameters;

    this.logger.debug(
      `[${this.constructor.name}] Searching for an Access Token with the provided Handle`,
      'c2eecec2-d311-42a3-8e0f-172da1a03ab4',
      { token: accessTokenHandle },
    );

    const accessToken = await this.accessTokenService.findOne(accessTokenHandle);

    if (accessToken === null) {
      const exc = new InvalidTokenException('Invalid Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Access Token`,
        '4ee2acef-37c9-45a3-91b1-36c1e3f655e6',
        { token: accessTokenHandle },
        exc,
      );

      throw exc;
    }

    if (new Date() > accessToken.expiresAt) {
      const exc = new InvalidTokenException('Expired Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Expired Access Token`,
        '2acf9848-0e18-44e8-bfb0-d5f8811b7967',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (new Date() < accessToken.validAfter) {
      const exc = new InvalidTokenException('The provided Access Token is not yet valid.');

      this.logger.error(
        `[${this.constructor.name}] The provided Access Token is not yet valid`,
        'de62e4a6-aa7c-4144-82e0-9ffc60a726f6',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (accessToken.isRevoked) {
      const exc = new InvalidTokenException('Revoked Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Revoked Access Token`,
        'a0d20207-c5fe-4fe6-a262-572132c749fc',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    this.logger.debug(`[${this.constructor.name}] Completed authorize()`, '073826bc-8261-45b1-bcc4-39bb3dc42918', {
      request,
      access_token: accessToken,
    });

    return accessToken;
  }
}
