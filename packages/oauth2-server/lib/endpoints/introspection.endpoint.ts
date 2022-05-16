import { Inject, Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/objects';
import { Optional } from '@guarani/types';

import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { AuthorizationServerOptions } from '../authorization-server/options/authorization-server.options';
import { ClientAuthenticator } from '../client-authentication/client-authenticator';
import { AbstractToken } from '../entities/abstract-token';
import { Client } from '../entities/client';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { IntrospectionResponse } from '../models/introspection-response';
import { IntrospectionParameters } from '../models/introspection-parameters';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { IRefreshTokenService } from '../services/refresh-token.service.interface';
import { Endpoint } from '../types/endpoint';
import { TokenTypeHint } from '../types/token-type-hint';
import { IEndpoint } from './endpoint.interface';
import { HttpMethod } from '../types/http-method';

interface FindTokenResult {
  readonly entity: AbstractToken;
  readonly tokenType: TokenTypeHint;
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
export class IntrospectionEndpoint implements IEndpoint {
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
   * HTTP Methods of the Endpoint.
   */
  public readonly methods: HttpMethod[] = ['post'];

  /**
   * Default HTTP Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
  };

  /**
   * Token Type Hints supported by the Introspection Endpoint.
   */
  private readonly supportedTokenTypeHints: TokenTypeHint[] = ['access_token'];

  /**
   * Instantiates a new Introspection Endpoint.
   *
   * @param clientAuthenticator Instance of the Client Authenticator.
   * @param authorizationServerOptions Configuration Parameters of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly clientAuthenticator: ClientAuthenticator,
    @Inject('AuthorizationServerOptions') private readonly authorizationServerOptions: AuthorizationServerOptions,
    @Inject('AccessTokenService') private readonly accessTokenService: IAccessTokenService,
    @Inject('RefreshTokenService', true) private readonly refreshTokenService?: Optional<IRefreshTokenService>
  ) {
    if (this.authorizationServerOptions.enableRefreshTokenIntrospection) {
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
   * @param request HTTP Request.
   * @returns HTTP Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <IntrospectionParameters>request.body;

    try {
      this.checkParameters(parameters);

      const client = await this.clientAuthenticator.authenticate(request);
      const introspectionResponse = await this.introspectToken(parameters, client);

      return new HttpResponse().setHeaders(this.headers).json(introspectionResponse);
    } catch (exc: any) {
      const error = exc instanceof OAuth2Exception ? exc : new ServerErrorException(exc.message);

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
  protected checkParameters(parameters: IntrospectionParameters): void {
    const { token, token_type_hint } = parameters;

    if (typeof token !== 'string') {
      throw new InvalidRequestException('Invalid parameter "token".');
    }

    if (token_type_hint !== undefined && !this.supportedTokenTypeHints.includes(token_type_hint)) {
      throw new UnsupportedTokenTypeException(`Unsupported token_type_hint "${token_type_hint}".`);
    }
  }

  /**
   * Introspects the provide Token for its metadata.
   *
   * @param parameters Parameters of the Introspection Request.
   * @param client Authenticated Client.
   * @returns Metadata of the Token.
   */
  private async introspectToken(parameters: IntrospectionParameters, client: Client): Promise<IntrospectionResponse> {
    const { token, token_type_hint } = parameters;

    const { entity, tokenType } = (await this.findTokenEntity(token, token_type_hint)) ?? {};

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
  private async findTokenEntity(
    token: string,
    tokenTypeHint?: Optional<TokenTypeHint>
  ): Promise<Optional<FindTokenResult>> {
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
  private async findAccessToken(token: string): Promise<Optional<FindTokenResult>> {
    const entity = await this.accessTokenService.findAccessToken(token);

    if (entity !== undefined) {
      return { entity, tokenType: 'access_token' };
    }
  }

  /**
   * Searches the application's storage for a Refresh Token.
   *
   * @param token Token provided by the Client.
   * @returns Result of the search.
   */
  private async findRefreshToken(token: string): Promise<Optional<FindTokenResult>> {
    if (!this.authorizationServerOptions.enableRefreshTokenIntrospection) {
      return;
    }

    const entity = await this.refreshTokenService!.findRefreshToken(token);

    if (entity !== undefined) {
      return { entity, tokenType: 'refresh_token' };
    }
  }

  /**
   * Returns the metadata of the provided Token Entity.
   *
   * @param token Token Entity to be introspected.
   * @returns Metadata of the provided Token Entity.
   */
  private getTokenMetadata(token: AbstractToken): IntrospectionResponse {
    if (token.isRevoked || new Date() < token.validAfter || new Date() >= token.expiresAt) {
      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    // TODO: Add check for username and jti.
    // TODO: Add policy to restrict or add parameters.
    return removeNullishValues<IntrospectionResponse>({
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
      iss: this.authorizationServerOptions.issuer,
      jti: undefined,
    });
  }
}
