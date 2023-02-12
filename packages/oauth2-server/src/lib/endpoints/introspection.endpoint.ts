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
import { IntrospectionRequest } from '../messages/introspection-request';
import { IntrospectionResponse } from '../messages/introspection-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

interface FindTokenResult {
  readonly entity: AccessToken | RefreshToken;
  readonly tokenType: string;
}

/**
 * Implementation of the **Introspection** Endpoint.
 *
 * This endpoint is used by the Client to obtain information about a Token in its possession.
 *
 * If the Client succeeds to authenticate but provides a Token that was not issued to itself, is invalid,
 * does not exist within the Authorization Server, or is otherwise unknown or invalid, it will return
 * a standard response of the format `{"active": false}`.
 *
 * If every verification step passes, then the Authorization Server returns the information
 * associated to the Token back to the Client.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7662.html
 */
@Injectable()
export class IntrospectionEndpoint implements EndpointInterface {
  /**
   * Inactive Token Standard Response.
   */
  private static readonly INACTIVE_TOKEN: IntrospectionResponse = { active: false };

  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'introspection';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/introspect';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Token Type Hints supported by the Introspection Endpoint.
   */
  private readonly supportedTokenTypeHints: string[] = ['access_token'];

  /**
   * Instantiates a new Introspection Endpoint.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
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
    if (this.settings.enableRefreshTokenIntrospection) {
      if (this.refreshTokenService === undefined) {
        throw new Error('Cannot enable Refresh Token Introspection without a Refresh Token Service.');
      }

      this.supportedTokenTypeHints.push('refresh_token');
    }
  }

  /**
   * Introspects the provided Token about its metadata and state within the Authorization Server.
   *
   * First it validates the  Request of the Client by making sure the required parameter **token** is present,
   * and that the Client can authenticate within the Endpoint.
   *
   * It then tries to lookup the information about the Token from the application's storage.
   *
   * If the Client passes the authentication, the token is still valid, and the Client is the owner of the token,
   * this method will return the Token's metadata back to the Client.
   *
   * If it is determined that the Client should not have access to the Token's metadata, or if the Token
   * is not valid anymore, this method will return an Introspection Response in the format `{"active": false}`.
   *
   * This is done in order to prevent a Client from fishing any information that it should not have access to.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <IntrospectionRequest>request.body;

    try {
      this.checkParameters(parameters);

      const client = await this.clientAuthenticationHandler.authenticate(request);
      const introspectionResponse = await this.introspectToken(parameters, client);

      return new HttpResponse().setHeaders(this.headers).json(introspectionResponse);
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
   * Checks if the Parameters of the Introspection Request are valid.
   *
   * @param parameters Parameters of the Introspection Request.
   */
  protected checkParameters(parameters: IntrospectionRequest): void {
    const { token, token_type_hint: tokenTypeHint } = parameters;

    if (typeof token !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "token".' });
    }

    if (tokenTypeHint !== undefined && !this.supportedTokenTypeHints.includes(tokenTypeHint)) {
      throw new UnsupportedTokenTypeException({ description: `Unsupported token_type_hint "${tokenTypeHint}".` });
    }
  }

  /**
   * Introspects the provide Token for its metadata.
   *
   * @param parameters Parameters of the Introspection Request.
   * @param client Authenticated Client.
   * @returns Metadata of the Token.
   */
  private async introspectToken(parameters: IntrospectionRequest, client: Client): Promise<IntrospectionResponse> {
    const { token, token_type_hint: tokenTypeHint } = parameters;

    const { entity, tokenType } = (await this.findTokenEntity(token, tokenTypeHint)) ?? {};

    if (entity === undefined || tokenType === undefined) {
      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    const clientId = Buffer.from(client.id, 'utf8');
    const tokenClientId = Buffer.from(entity.client.id, 'utf8');

    if (clientId.length !== tokenClientId.length || !timingSafeEqual(clientId, tokenClientId)) {
      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    return this.getTokenMetadata(entity);
  }

  /**
   * Searches the application's storage for a Token Entity that satisfies the Token provided by the Client.
   *
   * @param token Token provided by the Client.
   * @param tokenTypeHint Optional hint about the type of the Token.
   * @returns Resulting Token Entity and its type.
   */
  private async findTokenEntity(token: string, tokenTypeHint?: string): Promise<FindTokenResult | null> {
    switch (tokenTypeHint) {
      case 'access_token':
        return (await this.findAccessToken(token)) ?? (await this.findRefreshToken(token));

      case 'refresh_token':
      default:
        return (await this.findRefreshToken(token)) ?? (await this.findAccessToken(token));
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
    if (!this.settings.enableRefreshTokenIntrospection) {
      return null;
    }

    const entity = await this.refreshTokenService!.findOne(token);

    return entity !== null ? { entity, tokenType: 'refresh_token' } : null;
  }

  /**
   * Returns the metadata of the provided Token Entity.
   *
   * @param token Token Entity to be introspected.
   * @returns Metadata of the provided Token Entity.
   */
  private getTokenMetadata(token: AccessToken | RefreshToken): IntrospectionResponse {
    if (token.isRevoked || new Date() < token.validAfter || new Date() >= token.expiresAt) {
      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    // TODO: Add check for username and jti.
    // TODO: Add policy to restrict or add parameters.
    return {
      active: true,
      scope: token.scopes.join(' '),
      client_id: token.client.id,
      username: undefined,
      token_type: 'Bearer',
      exp: Math.ceil(token.expiresAt.getTime() / 1000),
      iat: Math.ceil(token.issuedAt.getTime() / 1000),
      nbf: Math.ceil(token.validAfter.getTime() / 1000),
      sub: token.user?.id,
      aud: token.client.id,
      iss: this.settings.issuer,
      jti: undefined,
    };
  }
}