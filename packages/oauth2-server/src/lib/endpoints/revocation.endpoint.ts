import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { Inject, Injectable, Optional } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { RevocationContext } from '../context/revocation-context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { RevocationRequestValidator } from '../validators/revocation-request.validator';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Revocation** Endpoint.
 *
 * This endpoint is used by the Client to revoke a Token in its possession.
 *
 * If the Client succeeds to authenticate but provides a token that was not issued to itself, the Authorization server
 * does not revoke the token, since the Client is not authorized to operate it.
 *
 * If the token is already invalid, does not exist within the Authorization Server or is otherwise unknown or invalid,
 * it is already considered ***revoked*** and, therefore, no further operation occurs.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7009.html
 */
@Injectable()
export class RevocationEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'revocation';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/revoke';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Revocation Endpoint.
   *
   * @param logger Logger of the Authorization Server.
   * @param validator Instance of the Revocation Request Validator.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly validator: RevocationRequestValidator,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService?: RefreshTokenServiceInterface,
  ) {}

  /**
   * Revokes a previously issued Token.
   *
   * First it validates the Revocation Request of the Client by making sure the required parameter **token** is present,
   * and that the Client can authenticate within the Revocation Endpoint.
   *
   * It then tries to revoke the provided Token from the application's storage.
   *
   * Unless the Client presents an unsupported token_type_hint, fails to authenticate or does not present a token,
   * this endpoint will **ALWAYS** return a ***success*** response.
   *
   * This is done in order to prevent a Client from fishing any information that it should not have access to.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, 'a8c9a314-35ec-45e1-bf9d-395aa2aad646', {
      request,
    });

    try {
      const context = await this.validator.validate(request);

      await this.revokeToken(context);

      const response = new HttpResponse().setHeaders(this.headers);

      this.logger.debug(`[${this.constructor.name}] Revocation completed`, '377e09ea-3cf6-483d-b772-e79514f12f39', {
        response,
      });

      return response;
    } catch (exc: unknown) {
      const error =
        exc instanceof OAuth2Exception
          ? exc
          : new ServerErrorException('An unexpected error occurred.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Error on Revocation Endpoint`,
        '26e4aabf-0b3f-413e-9ae5-2fba2f3db6bc',
        { request },
        error,
      );

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(removeNullishValues(error.toJSON()));
    }
  }

  /**
   * Revokes the provided Token from the application's storage.
   *
   * @param context Revocation Context.
   */
  private async revokeToken(context: RevocationContext): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called revokeToken()`, '75153491-d19b-4f81-8064-8ec354d87f66', {
      context,
    });

    const { client, token, tokenType } = context;

    if (token === null || tokenType === null) {
      this.logger.debug(`[${this.constructor.name}] No Token found`, '392b2f22-97c9-42f1-a330-5e89cd8ed73a');
      return;
    }

    if (!this.checkTokenClient(token, client)) {
      this.logger.debug(
        `[${this.constructor.name}] Token does not pertain to the Client`,
        'a293bae3-5702-45f8-b5f4-7ef636dc910e',
        { context },
      );

      return;
    }

    switch (tokenType) {
      case 'access_token':
        this.logger.debug(`[${this.constructor.name}] Revoked Access Token`, '78f45220-e889-4106-b848-32f016329a4a', {
          token,
        });

        return await this.accessTokenService.revoke(<AccessToken>token);

      case 'refresh_token':
        this.logger.debug(`[${this.constructor.name}] Revoked Refresh Token`, '5e2977f3-5ed9-4c46-9956-34d9c4771c8d', {
          token,
        });

        return await this.refreshTokenService!.revoke(<RefreshToken>token);
    }
  }

  /**
   * Checks if the Client of the Request is the same to which the Token was issued to.
   *
   * @param token Instance of the Token retrieved based on the handle provided by the Client.
   * @param client Client of the Request.
   * @returns The Client of the Request is the same to which the Token was issued to.
   */
  private checkTokenClient(token: AccessToken | RefreshToken, client: Client): boolean {
    const clientIdBuffer = Buffer.from(client.id, 'utf8');
    const tokenClientIdBuffer = Buffer.from(token.client!.id, 'utf8');

    return clientIdBuffer.length === tokenClientIdBuffer.length && timingSafeEqual(clientIdBuffer, tokenClientIdBuffer);
  }
}
