import { Inject, Injectable, Optional } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { RevocationContext } from '../context/revocation.context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { RevocationRequest } from '../requests/revocation-request';
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
   * @param validator Instance of the Revocation Request Validator.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly validator: RevocationRequestValidator,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService?: RefreshTokenServiceInterface
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
  public async handle(request: HttpRequest<RevocationRequest>): Promise<HttpResponse> {
    try {
      const context = await this.validator.validate(request);

      await this.revokeToken(context);

      return new HttpResponse().setHeaders(this.headers);
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
   * Revokes the provided Token from the application's storage.
   *
   * @param context Revocation Context.
   */
  private async revokeToken(context: RevocationContext): Promise<void> {
    const { client, token, tokenType } = context;

    if (token === null || tokenType === null) {
      return;
    }

    if (!this.checkTokenClient(token, client)) {
      return;
    }

    switch (tokenType) {
      case 'access_token':
        return await this.accessTokenService.revoke(<AccessToken>token);

      case 'refresh_token':
        return await this.refreshTokenService?.revoke(<RefreshToken>token);
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
    const tokenClientIdBuffer = Buffer.from(token.client.id, 'utf8');

    return clientIdBuffer.length === tokenClientIdBuffer.length && timingSafeEqual(clientIdBuffer, tokenClientIdBuffer);
  }
}
