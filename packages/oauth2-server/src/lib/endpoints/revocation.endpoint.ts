import { Inject, Injectable, Optional } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { RevocationRequest } from '../messages/revocation-request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { TokenTypeHint } from '../types/token-type-hint.type';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

interface FindTokenResult {
  readonly entity: AccessToken | RefreshToken;
  readonly tokenType: TokenTypeHint;
}

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
   * Token Type Hints supported by the Revocation Endpoint.
   */
  private readonly supportedTokenTypeHints: TokenTypeHint[] = ['access_token'];

  /**
   * Instantiates a new Revocation Endpoint.
   *
   * @param clientAuthenticationHandler Instance of the Client Authenticator.
   * @param settings Settings of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService?: RefreshTokenServiceInterface
  ) {
    if (this.settings.enableRefreshTokenRevocation) {
      if (!this.settings.grantTypes.includes('refresh_token')) {
        throw new Error('The Authorization Server disabled using Refresh Tokens.');
      }

      if (this.refreshTokenService === undefined) {
        throw new Error('Cannot enable Refresh Token Revocation without a Refresh Token Service.');
      }

      this.supportedTokenTypeHints.push('refresh_token');
    }
  }

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
    const parameters = request.data;

    try {
      this.checkParameters(parameters);

      const client = await this.clientAuthenticationHandler.authenticate(request);

      await this.revokeToken(parameters, client);

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
   * Checks if the Parameters of the Revocation Request are valid.
   *
   * @param parameters Parameters of the Revocation Request.
   */
  protected checkParameters(parameters: RevocationRequest): void {
    const { token, token_type_hint: tokenTypeHint } = parameters;

    if (typeof token !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "token".' });
    }

    if (tokenTypeHint !== undefined && !this.supportedTokenTypeHints.includes(tokenTypeHint)) {
      throw new UnsupportedTokenTypeException({ description: `Unsupported token_type_hint "${tokenTypeHint}".` });
    }
  }

  /**
   * Revokes the provided Token from the application's storage.
   *
   * @param parameters Parameters of the Revocation Request.
   * @param client Client of the Request.
   */
  private async revokeToken(parameters: RevocationRequest, client: Client): Promise<void> {
    const { token, token_type_hint: tokenTypeHint } = parameters;

    const { entity, tokenType } = (await this.findTokenEntity(token, tokenTypeHint)) ?? {};

    if (entity === undefined || tokenType === undefined) {
      return;
    }

    if (!this.checkEntityClient(entity, client)) {
      return;
    }

    switch (tokenType) {
      case 'access_token':
        return await this.accessTokenService.revoke(<AccessToken>entity);

      case 'refresh_token':
        return await this.refreshTokenService?.revoke(<RefreshToken>entity);
    }
  }

  /**
   * Searches the application's storage for a Token Entity that satisfies the Token provided by the Client.
   *
   * @param token Token provided by the Client.
   * @param tokenTypeHint Optional hint about the type of the Token.
   * @returns Resulting Token Entity and its type.
   */
  private async findTokenEntity(token: string, tokenTypeHint?: TokenTypeHint): Promise<FindTokenResult | null> {
    switch (tokenTypeHint) {
      case 'refresh_token':
        return (await this.findRefreshToken(token)) ?? (await this.findAccessToken(token));

      case 'access_token':
      default:
        return (await this.findAccessToken(token)) ?? (await this.findRefreshToken(token));
    }
  }

  /**
   * Searches the application's storage for an Access Token.
   *
   * @param token Token provided by the Client.
   * @returns Result of the search.
   */
  private async findAccessToken(token: string): Promise<FindTokenResult | null> {
    const entity = await this.accessTokenService.findOne(token);
    return entity !== null ? { entity, tokenType: 'access_token' } : null;
  }

  /**
   * Searches the application's storage for a Refresh Token.
   *
   * @param token Token provided by the Client.
   * @returns Result of the search.
   */
  private async findRefreshToken(token: string): Promise<FindTokenResult | null> {
    const entity = await this.refreshTokenService?.findOne(token);
    return entity != null ? { entity, tokenType: 'refresh_token' } : null;
  }

  /**
   * Checks if the Client of the Request is the same to which the Token was issued to.
   *
   * @param entity Instance of the Token retrieved based on the handle provided by the Client.
   * @param client Client of the Request.
   * @returns The Client of the Request is the same to which the Token was issued to.
   */
  private checkEntityClient(entity: AccessToken | RefreshToken, client: Client): boolean {
    const clientIdBuffer = Buffer.from(client.id, 'utf8');
    const tokenClientIdBuffer = Buffer.from(entity.client.id, 'utf8');

    return clientIdBuffer.length === tokenClientIdBuffer.length && timingSafeEqual(clientIdBuffer, tokenClientIdBuffer);
  }
}
