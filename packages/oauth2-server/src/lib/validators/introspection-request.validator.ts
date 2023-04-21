import { Inject, Injectable, Optional } from '@guarani/di';

import { IntrospectionContext } from '../context/introspection.context';
import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpRequest } from '../http/http.request';
import { IntrospectionRequest } from '../requests/introspection-request';
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
 * Implementation of the Introspection Request Validator.
 */
@Injectable()
export class IntrospectionRequestValidator {
  /**
   * Token Type Hints supported by the Introspection Endpoint.
   */
  private readonly supportedTokenTypeHints: TokenTypeHint[] = ['access_token'];

  /**
   * Instantiates a new Introspection Request Validator.
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
      if (!this.settings.grantTypes.includes('refresh_token')) {
        throw new Error('The Authorization Server disabled using Refresh Tokens.');
      }

      if (this.refreshTokenService === undefined) {
        throw new Error('Cannot enable Refresh Token Introspection without a Refresh Token Service.');
      }

      this.supportedTokenTypeHints.push('refresh_token');
    }
  }

  /**
   * Validates the Http Introspection Request and returns the actors of the Introspection Context.
   *
   * @param request Http Request.
   * @returns Introspection Context.
   */
  public async validate(request: HttpRequest): Promise<IntrospectionContext> {
    const parameters = <IntrospectionRequest>request.body;

    this.checkParameters(parameters);

    const client = await this.clientAuthenticationHandler.authenticate(request);
    const tokenResult = await this.findToken(parameters.token, parameters.token_type_hint);

    if (tokenResult === null) {
      return { client, parameters, token: null, tokenType: null };
    }

    return { client, parameters, token: tokenResult.token, tokenType: tokenResult.tokenType };
  }

  /**
   * Checks if the Parameters of the Introspection Request are valid.
   *
   * @param parameters Parameters of the Introspection Request.
   */
  private checkParameters(parameters: IntrospectionRequest): void {
    const { token, token_type_hint: tokenTypeHint } = parameters;

    if (typeof token !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "token".' });
    }

    if (tokenTypeHint !== undefined && !this.supportedTokenTypeHints.includes(tokenTypeHint)) {
      throw new UnsupportedTokenTypeException({ description: `Unsupported token_type_hint "${tokenTypeHint}".` });
    }
  }

  /**
   * Searches the application's storage for a Token that satisfies the Token Handle provided by the Client.
   *
   * @param handle Token Handle provided by the Client.
   * @param tokenTypeHint Optional hint about the type of the Token.
   * @returns Resulting Token and its type.
   */
  private async findToken(handle: string, tokenTypeHint?: TokenTypeHint): Promise<FindTokenResult | null> {
    switch (tokenTypeHint) {
      case 'refresh_token':
        return (await this.findRefreshToken(handle)) ?? (await this.findAccessToken(handle));

      case 'access_token':
      default:
        return (await this.findAccessToken(handle)) ?? (await this.findRefreshToken(handle));
    }
  }

  /**
   * Searches the application's storage for an Access Token.
   *
   * @param handle Token Handle provided by the Client.
   * @returns Result of the search.
   */
  private async findAccessToken(handle: string): Promise<FindTokenResult | null> {
    const token = await this.accessTokenService.findOne(handle);
    return token !== null ? { token, tokenType: 'access_token' } : null;
  }

  /**
   * Searches the application's storage for a Refresh Token.
   *
   * @param handle Token Handle provided by the Client.
   * @returns Result of the search.
   */
  private async findRefreshToken(handle: string): Promise<FindTokenResult | null> {
    const token = this.settings.enableRefreshTokenIntrospection
      ? await this.refreshTokenService?.findOne(handle)
      : null;

    return token != null ? { token, tokenType: 'refresh_token' } : null;
  }
}
