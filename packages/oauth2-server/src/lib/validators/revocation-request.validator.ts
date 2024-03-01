import { Inject, Injectable, Optional } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { RevocationContext } from '../context/revocation-context';
import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { RevocationRequest } from '../requests/revocation-request';
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
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param settings Settings of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService?: RefreshTokenServiceInterface,
  ) {
    if (this.settings.enableRefreshTokenRevocation) {
      if (!this.settings.grantTypes.includes('refresh_token')) {
        const exc = new Error('The Authorization Server disabled using Refresh Tokens.');

        this.logger.critical(
          `[${this.constructor.name}] The Authorization Server disabled using Refresh Tokens`,
          '0c3e9e36-ed25-492d-819d-e60b4cc0458b',
          { grant_types: this.settings.grantTypes },
          exc,
        );

        throw exc;
      }

      if (typeof this.refreshTokenService === 'undefined') {
        const exc = new Error('Cannot enable Refresh Token Revocation without a Refresh Token Service.');

        this.logger.critical(
          `[${this.constructor.name}] Cannot enable Refresh Token Revocation without a Refresh Token Service`,
          'a499e69f-2157-4f1d-b5ed-03124a2221cf',
          null,
          exc,
        );

        throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '172a3169-7a52-4247-ae51-d121c73359e7', {
      request,
    });

    const parameters = request.form<RevocationRequest>();

    const client = await this.clientAuthenticationHandler.authenticate(request);
    const tokenResult = await this.findToken(parameters);

    if (tokenResult === null || tokenResult.token.client === null) {
      const context: RevocationContext = { client, parameters, token: null, tokenType: null };

      this.logger.debug(
        `[${this.constructor.name}] Revocation Request validation completed`,
        '1a635a72-3b8a-47e1-9a07-69b12389e97a',
        { context, token_result: tokenResult },
      );

      return context;
    }

    const context: RevocationContext = {
      client,
      parameters,
      token: tokenResult.token,
      tokenType: tokenResult.tokenType,
    };

    this.logger.debug(
      `[${this.constructor.name}] Revocation Request validation completed`,
      'b843530c-0eee-4ab2-a027-6b0e44a6761c',
      { context },
    );

    return context;
  }

  /**
   * Searches the application's storage for a Token that satisfies the Token Handle provided by the Client.
   *
   * @param parameters Parameters of the Revocation Request.
   * @returns Resulting Token and its type.
   */
  private async findToken(parameters: RevocationRequest): Promise<Nullable<FindTokenResult>> {
    this.logger.debug(`[${this.constructor.name}] Called findToken()`, '718534b0-cd9a-46e5-935b-2546df66d134', {
      parameters,
    });

    if (typeof parameters.token === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "token".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "token"`,
        '77fb891e-04f9-4ad2-9c72-ab0deeda123b',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (
      typeof parameters.token_type_hint !== 'undefined' &&
      !this.supportedTokenTypeHints.includes(parameters.token_type_hint)
    ) {
      const exc = new UnsupportedTokenTypeException(`Unsupported token_type_hint "${parameters.token_type_hint}".`);

      this.logger.error(
        `[${this.constructor.name}] Unsupported token_type_hint "${parameters.token_type_hint}"`,
        'b30a3503-5f84-4959-8a37-ea9b4accf3dc',
        { parameters, supported_token_type_hints: this.supportedTokenTypeHints },
        exc,
      );

      throw exc;
    }

    switch (parameters.token_type_hint) {
      case 'refresh_token':
        return (await this.findRefreshToken(parameters.token)) ?? (await this.findAccessToken(parameters.token));

      case 'access_token':
      default:
        return (await this.findAccessToken(parameters.token)) ?? (await this.findRefreshToken(parameters.token));
    }
  }

  /**
   * Searches the application's storage for an Access Token.
   *
   * @param handle Token Handle provided by the Client.
   * @returns Result of the search.
   */
  private async findAccessToken(handle: string): Promise<Nullable<FindTokenResult>> {
    this.logger.debug(`[${this.constructor.name}] Called findAccessToken()`, '77ce1124-9053-4c43-b98d-61da0c8319c5', {
      handle,
    });

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
    this.logger.debug(`[${this.constructor.name}] Called findRefreshToken()`, '82d97b04-d9b4-4669-872b-4bd717b8b840', {
      handle,
    });

    if (typeof this.refreshTokenService === 'undefined') {
      this.logger.debug(
        `[${this.constructor.name}] Refresh Token Service not registered`,
        'a8d9f8b8-78c2-4cd9-9b1f-09eb6d1ab3c4',
      );

      return null;
    }

    const token = this.settings.enableRefreshTokenRevocation ? await this.refreshTokenService.findOne(handle) : null;

    return token !== null ? { token, tokenType: 'refresh_token' } : null;
  }
}
