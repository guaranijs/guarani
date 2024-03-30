import { Inject, Injectable } from '@guarani/di';

import { AccessToken } from '../entities/access-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../exceptions/invalid-token.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
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
    this.logger.debug(`[${this.constructor.name}] Called hasBeenRequested()`, 'dfb1a7c5-cf60-47fd-8d84-4d7e74dc7007', {
      request,
    });

    const result = request.headers.authorization?.startsWith('Bearer') === true;

    this.logger.debug(
      `[${this.constructor.name}] Completed hasBeenRequested()`,
      '7785a49b-4181-4c39-acd6-019a114c39a0',
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
    this.logger.debug(`[${this.constructor.name}] Called authorize()`, 'f4045b3c-8d2a-4531-b077-9bc62c334e7c', {
      request,
    });

    const { authorization } = request.headers;

    const [, accessTokenHandle] = authorization!.split(' ', 2);

    if (typeof accessTokenHandle === 'undefined') {
      const exc = new InvalidRequestException('Missing Bearer Token.');

      this.logger.error(
        `[${this.constructor.name}] The Client did not provide a valid Bearer Token`,
        'f62ef0b7-d908-464d-b118-7d557b48be57',
        { authorization },
        exc,
      );

      throw exc;
    }

    if (!/^[a-zA-Z0-9+/\-_.~=]+$/.test(accessTokenHandle)) {
      const exc = new InvalidTokenException('Invalid Bearer Token.');

      this.logger.error(
        `[${this.constructor.name}] The Client provided an invalid Bearer Token`,
        '103dba13-ed3f-467a-aca0-246595ab3a4d',
        { token: accessTokenHandle },
        exc,
      );

      throw exc;
    }

    this.logger.debug(
      `[${this.constructor.name}] Searching for an Access Token with the provided Handle`,
      'f654c1e8-6b48-4542-acad-66f689d00bbd',
      { token: accessTokenHandle },
    );

    const accessToken = await this.accessTokenService.findOne(accessTokenHandle);

    if (accessToken === null) {
      const exc = new InvalidTokenException('Invalid Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Access Token`,
        'cefea084-4ec0-4cd1-bace-024acb22d789',
        { token: accessTokenHandle },
        exc,
      );

      throw exc;
    }

    if (new Date() > accessToken.expiresAt) {
      const exc = new InvalidTokenException('Expired Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Expired Access Token`,
        'abe3e437-fd1c-467e-a0be-56a56ae23cf1',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (new Date() < accessToken.validAfter) {
      const exc = new InvalidTokenException('The provided Access Token is not yet valid.');

      this.logger.error(
        `[${this.constructor.name}] The provided Access Token is not yet valid`,
        '86b4e8af-1463-413e-9240-78e88d8076ab',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    if (accessToken.isRevoked) {
      const exc = new InvalidTokenException('Revoked Access Token.');

      this.logger.error(
        `[${this.constructor.name}] Revoked Access Token`,
        '3e8ccfda-ab4a-4cd1-a81c-a6378cf5514f',
        { access_token: accessToken },
        exc,
      );

      throw exc;
    }

    this.logger.debug(`[${this.constructor.name}] Completed authorize()`, '300b9e3a-0f05-4768-9aa8-174f58f5730e', {
      request,
      access_token: accessToken,
    });

    return accessToken;
  }
}
