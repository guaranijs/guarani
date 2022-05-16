import { Inject, Injectable, InjectAll } from '@guarani/di';
import { Optional } from '@guarani/types';

import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { AuthorizationServerOptions } from '../authorization-server/options/authorization-server.options';
import { ClientAuthenticator } from '../client-authentication/client-authenticator';
import { AbstractToken } from '../entities/abstract-token';
import { AccessToken } from '../entities/access-token';
import { Client } from '../entities/client';
import { RefreshToken } from '../entities/refresh-token';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { IGrantType } from '../grant-types/grant-type.interface';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { RevocationParameters } from '../models/revocation-parameters';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { IRefreshTokenService } from '../services/refresh-token.service.interface';
import { Endpoint } from '../types/endpoint';
import { HttpMethod } from '../types/http-method';
import { TokenTypeHint } from '../types/token-type-hint';
import { IEndpoint } from './endpoint.interface';

interface FindTokenResult {
  readonly entity: AbstractToken;
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
export class RevocationEndpoint implements IEndpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'revocation';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/revoke';

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
   * Token Type Hints supported by the Revocation Endpoint.
   */
  private readonly supportedTokenTypeHints: TokenTypeHint[] = ['refresh_token'];

  /**
   * Instantiates a new Revocation Endpoint.
   *
   * @param clientAuthenticator Instance of the Client Authenticator.
   * @param authorizationServerOptions Configuration Parameters of the Authorization Server.
   * @param refreshTokenService Instance of the Refresh Token Service.
   * @param grantTypes Grant Types supported by the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly clientAuthenticator: ClientAuthenticator,
    @Inject('AuthorizationServerOptions') private readonly authorizationServerOptions: AuthorizationServerOptions,
    @Inject('RefreshTokenService') private readonly refreshTokenService: IRefreshTokenService,
    @InjectAll('GrantType', true) grantTypes?: Optional<IGrantType[]>,
    @Inject('AccessTokenService', true) private readonly accessTokenService?: Optional<IAccessTokenService>
  ) {
    if (grantTypes?.find((grantType) => grantType.name === 'refresh_token') === undefined) {
      throw new Error('The Authorization Server does not support Refresh Tokens.');
    }

    if (this.authorizationServerOptions.enableAccessTokenRevocation) {
      if (this.accessTokenService === undefined) {
        throw new Error('Cannot enable Access Token Revocation without an Access Token Service.');
      }

      this.supportedTokenTypeHints.push('access_token');
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
   * @param request HTTP Request.
   * @returns HTTP Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <RevocationParameters>request.body;

    try {
      this.checkParameters(parameters);

      const client = await this.clientAuthenticator.authenticate(request);

      await this.revokeToken(parameters, client);

      return new HttpResponse().setHeaders(this.headers);
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
   * Checks if the Parameters of the Revocation Request are valid.
   *
   * @param parameters Parameters of the Revocation Request.
   */
  protected checkParameters(parameters: RevocationParameters): void {
    const { token, token_type_hint } = parameters;

    if (typeof token !== 'string') {
      throw new InvalidRequestException('Invalid parameter "token".');
    }

    if (token_type_hint !== undefined && !this.supportedTokenTypeHints.includes(token_type_hint)) {
      throw new UnsupportedTokenTypeException(`Unsupported token_type_hint "${token_type_hint}".`);
    }
  }

  /**
   * Revokes the provided Token from the application's storage.
   *
   * @param parameters Parameters of the Revocation Request.
   * @param client Client of the Request.
   */
  private async revokeToken(parameters: RevocationParameters, client: Client): Promise<void> {
    const { token, token_type_hint } = parameters;

    const { entity, tokenType } = (await this.findTokenEntity(token, token_type_hint)) ?? {};

    if (entity === undefined || tokenType === undefined) {
      return;
    }

    const clientId = Buffer.from(client.id, 'utf8');
    const tokenClientId = Buffer.from(entity.client.id, 'utf8');

    if (clientId.length !== tokenClientId.length || !timingSafeEqual(clientId, tokenClientId)) {
      return;
    }

    switch (tokenType) {
      case 'access_token':
        // This is not undefined because an Access Token was found.
        return await this.accessTokenService!.revokeAccessToken(<AccessToken>entity);

      case 'refresh_token':
        return await this.refreshTokenService.revokeRefreshToken(<RefreshToken>entity);
    }
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
  private async findAccessToken(token: string): Promise<Optional<FindTokenResult>> {
    if (!this.authorizationServerOptions.enableAccessTokenRevocation) {
      return;
    }

    const entity = await this.accessTokenService!.findAccessToken(token);

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
    const entity = await this.refreshTokenService.findRefreshToken(token);

    if (entity !== undefined) {
      return { entity, tokenType: 'refresh_token' };
    }
  }
}
