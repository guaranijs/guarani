import { Inject, Injectable } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { getBodyParameters } from '../utils/get-body-parameters';
import { ClientAuthorizationInterface } from './client-authorization.interface';
import { ClientAuthorization } from './client-authorization.type';
import { FormEncodedBodyClientAuthorizationParameters } from './form-encoded-body.client-authorization.parameters';

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
    this.logger.debug(`[${this.constructor.name}] Called hasBeenRequested()`, '68793b95-975e-409f-8b21-d57968caa00c', {
      request,
    });

    if (request.method !== 'POST') {
      this.logger.debug(
        `[${this.constructor.name}] Completed hasBeenRequested()`,
        '41c29d90-d935-4e7c-84a6-1087532378fc',
        { request, result: false },
      );

      return false;
    }

    const { access_token: accessTokenId } = getBodyParameters<FormEncodedBodyClientAuthorizationParameters>(request);

    const result = typeof accessTokenId === 'string';

    this.logger.debug(
      `[${this.constructor.name}] Completed hasBeenRequested()`,
      '1d3806e9-a29e-42c1-bea9-2f7b29c4190d',
      { request, result },
    );

    return result;
  }

  /**
   * Checks and returns the Access Token requested by the Client.
   *
   * @param request Http Request.
   * @returns Access Token based on the provided Access Token Identifier.
   */
  public async authorize(request: HttpRequest): Promise<AccessToken> {
    this.logger.debug(`[${this.constructor.name}] Called authorize()`, 'dc82c8f6-d144-472a-a14a-3fd7c888fce0', {
      request,
    });

    const { access_token: accessTokenId } = getBodyParameters<FormEncodedBodyClientAuthorizationParameters>(request);

    this.logger.debug(
      `[${this.constructor.name}] Searching for an Access Token with the provided Identifier`,
      'f272458d-6317-4bd4-b038-5cf4151f2be7',
      { token: accessTokenId },
    );

    const accessToken = await this.accessTokenService.findOne(accessTokenId);

    if (accessToken === null) {
      const exc = new InvalidTokenException('Invalid Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Access Token`,
        '4592da12-4642-48ec-92bb-d62a585d1bcc',
        { token: accessTokenId },
        exc,
      );

      throw exc;
    }

    if (new Date() > accessToken.expiresAt) {
      const exc = new InvalidTokenException('Expired Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Expired Access Token`,
        '0921b15e-231c-4ab1-a65e-78d74d9f7531',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (new Date() < accessToken.validAfter) {
      const exc = new InvalidTokenException('The provided Access Token is not yet valid.');

      this.logger.error(
        `[${this.constructor.name}] The provided Access Token is not yet valid`,
        'a7c60242-07d2-4902-b88d-c7581a089972',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (accessToken.isRevoked) {
      const exc = new InvalidTokenException('Revoked Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Revoked Access Token`,
        '21e5f773-bc3a-49d3-98ae-3047b8fb79a8',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    this.logger.debug(`[${this.constructor.name}] Completed authorize()`, '1e280184-65a3-48e1-86cf-4123414deda3', {
      request,
      access_token: accessToken,
    });

    return accessToken;
  }
}
