import { URLSearchParams } from 'url';

import { Inject, Injectable, Optional } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { RevocationContext } from '../context/revocation-context';
import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpRequest } from '../http/http.request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { TokenTypeHint } from '../types/token-type-hint.type';

interface FindTokenResult {
  readonly token: AccessToken | RefreshToken;
  readonly tokenType: TokenTypeHint;
}

/**
 * Implementation of the Revocation Request Validator.
 */
@Injectable()
export class RevocationRequestValidator {
  /**
   * Token Type Hints supported by the Revocation Endpoint.
   */
  private readonly supportedTokenTypeHints: TokenTypeHint[] = ['access_token'];

  /**
   * Instantiates a new Revocation Request Validator.
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
    if (this.settings.enableRefreshTokenRevocation) {
      if (!this.settings.grantTypes.includes('refresh_token')) {
        throw new Error('The Authorization Server disabled using Refresh Tokens.');
      }

      if (typeof this.refreshTokenService === 'undefined') {
        throw new Error('Cannot enable Refresh Token Revocation without a Refresh Token Service.');
      }

      this.supportedTokenTypeHints.push('refresh_token');
    }
  }

  /**
   * Validates the Http Revocation Request and returns the actors of the Revocation Context.
   *
   * @param request Http Request.
   * @returns Revocation Context.
   */
  public async validate(request: HttpRequest): Promise<RevocationContext> {
    const parameters = request.form();

    const client = await this.clientAuthenticationHandler.authenticate(request);
    const tokenResult = await this.findToken(parameters);

    if (tokenResult === null || tokenResult.token.client === null) {
      return { client, parameters, token: null, tokenType: null };
    }

    return { client, parameters, token: tokenResult.token, tokenType: tokenResult.tokenType };
  }

  /**
   * Searches the application's storage for a Token that satisfies the Token Handle provided by the Client.
   *
   * @param parameters Parameters of the Revocation Request.
   * @returns Resulting Token and its type.
   */
  private async findToken(parameters: URLSearchParams): Promise<Nullable<FindTokenResult>> {
    const token = parameters.get('token');
    const tokenTypeHint = parameters.get('token_type_hint');

    if (token === null) {
      throw new InvalidRequestException('Invalid parameter "token".');
    }

    if (tokenTypeHint !== null && !this.supportedTokenTypeHints.includes(tokenTypeHint as TokenTypeHint)) {
      throw new UnsupportedTokenTypeException(`Unsupported token_type_hint "${tokenTypeHint}".`);
    }

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
   * @param handle Token Handle provided by the Client.
   * @returns Result of the search.
   */
  private async findAccessToken(handle: string): Promise<Nullable<FindTokenResult>> {
    const token = await this.accessTokenService.findOne(handle);
    return token !== null ? { token, tokenType: 'access_token' } : null;
  }

  /**
   * Searches the application's storage for a Refresh Token.
   *
   * @param handle Token Handle provided by the Client.
   * @returns Result of the search.
   */
  private async findRefreshToken(handle: string): Promise<Nullable<FindTokenResult>> {
    if (typeof this.refreshTokenService === 'undefined') {
      return null;
    }

    const token = this.settings.enableRefreshTokenRevocation ? await this.refreshTokenService.findOne(handle) : null;
    return token !== null ? { token, tokenType: 'refresh_token' } : null;
  }
}
