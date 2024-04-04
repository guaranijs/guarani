import { Inject, Injectable, Optional } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { IntrospectionContext } from '../context/introspection-context';
import { AccessToken } from '../entities/access-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedTokenTypeException } from '../exceptions/unsupported-token-type.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { IntrospectionRequest } from '../requests/introspection-request';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { TokenTypeHint } from '../types/token-type-hint.type';

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
    if (this.settings.enableRefreshTokenIntrospection) {
      if (!this.settings.grantTypes.includes('refresh_token')) {
        const exc = new Error('The Authorization Server disabled using Refresh Tokens.');

        this.logger.critical(
          `[${this.constructor.name}] The Authorization Server disabled using Refresh Tokens`,
          '871c0d2b-f4c0-41d7-95ae-b2dfefd1c8fe',
          { grant_types: this.settings.grantTypes },
          exc,
        );

        throw exc;
      }

      if (typeof this.refreshTokenService === 'undefined') {
        const exc = new Error('Cannot enable Refresh Token Introspection without a Refresh Token Service.');

        this.logger.critical(
          `[${this.constructor.name}] Cannot enable Refresh Token Introspection without a Refresh Token Service`,
          'ebe6627c-b51a-42c4-9b0b-7880e518a4fc',
          null,
          exc,
        );

        throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '7a854673-67b6-420b-be53-85c91ae6da17', {
      request,
    });

    const parameters = request.form<IntrospectionRequest>();

    const client = await this.clientAuthenticationHandler.authenticate(request);
    const token = await this.findToken(parameters);

    if (token === null || token.client === null) {
      const context: IntrospectionContext = { client, parameters, token: null };

      this.logger.debug(
        `[${this.constructor.name}] Introspection Request validation completed`,
        'd7ade187-6b06-4833-9cb4-9553d665d1fc',
        { context },
      );

      return context;
    }

    const context: IntrospectionContext = {
      client,
      parameters,
      token,
    };

    this.logger.debug(
      `[${this.constructor.name}] Introspection Request validation completed`,
      '209cf010-fe6d-4311-adc1-11a13c07da9f',
      { context },
    );

    return context;
  }

  /**
   * Searches the application's storage for a Token that satisfies the Token Identifier provided by the Client.
   *
   * @param parameters Parameters of the Introspection Request.
   * @returns Resulting Token and its type.
   */
  private async findToken(parameters: IntrospectionRequest): Promise<Nullable<AccessToken | RefreshToken>> {
    this.logger.debug(`[${this.constructor.name}] Called findToken()`, '1255c96a-4d1f-45a6-b3eb-c5681d0f0dbb', {
      parameters,
    });

    if (typeof parameters.token === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "token".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "token"`,
        '737a3f01-1215-4974-8e96-3a8d964d7e9f',
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
        'bff9ec1c-eb91-4657-af13-2f3c04329dfb',
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
   * @param id Token Identifier provided by the Client.
   * @returns Result of the search.
   */
  private async findAccessToken(id: string): Promise<Nullable<AccessToken>> {
    this.logger.debug(`[${this.constructor.name}] Called findAccessToken()`, 'a4d43566-a501-4d48-bbf2-0ad1e385a655', {
      id,
    });

    return await this.accessTokenService.findOne(id);
  }

  /**
   * Searches the application's storage for a Refresh Token.
   *
   * @param id Token Identifier provided by the Client.
   * @returns Result of the search.
   */
  private async findRefreshToken(id: string): Promise<Nullable<RefreshToken>> {
    this.logger.debug(`[${this.constructor.name}] Called findRefreshToken()`, 'c85c5390-cb7b-43e6-96e8-0002ea5d8b28', {
      id,
    });

    if (typeof this.refreshTokenService === 'undefined') {
      this.logger.debug(
        `[${this.constructor.name}] Refresh Token Service not registered`,
        '5eed5250-0717-403c-a006-c3c2d968f26d',
      );

      return null;
    }

    return this.settings.enableRefreshTokenIntrospection ? await this.refreshTokenService.findOne(id) : null;
  }
}
