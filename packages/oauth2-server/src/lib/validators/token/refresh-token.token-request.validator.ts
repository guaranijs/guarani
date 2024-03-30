import { Inject, Injectable, InjectAll } from '@guarani/di';

import { RefreshTokenTokenContext } from '../../context/token/refresh-token.token-context';
import { Client } from '../../entities/client.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { RefreshTokenTokenRequest } from '../../requests/token/refresh-token.token-request';
import { RefreshTokenServiceInterface } from '../../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../../services/refresh-token.service.token';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **Refresh Token** Token Request Validator.
 */
@Injectable()
export class RefreshTokenTokenRequestValidator extends TokenRequestValidator<RefreshTokenTokenContext> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'refresh_token';

  /**
   * Instantiates a new Refresh Token Token Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param refreshTokenService Instance of the Refresh Token Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    private readonly scopeHandler: ScopeHandler,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService: RefreshTokenServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[],
  ) {
    super(logger, clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<RefreshTokenTokenContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, 'd9a9b512-946c-4f18-b645-81507a500d31', {
      request,
    });

    const context = await super.validate(request);

    const { parameters } = context;

    const refreshToken = await this.getRefreshToken(parameters);
    const scopes = this.getScopes(parameters, refreshToken, context.client);

    Object.assign<RefreshTokenTokenContext, Partial<RefreshTokenTokenContext>>(context, { refreshToken, scopes });

    this.logger.debug(
      `[${this.constructor.name}] Refresh Token Token Request validation completed`,
      '1a66508c-5942-4c68-82c1-2929f85c944a',
      { context },
    );

    return context;
  }

  /**
   * Fetches the requested Refresh Token from the application's storage.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Refresh Token based on the provided token.
   */
  private async getRefreshToken(parameters: RefreshTokenTokenRequest): Promise<RefreshToken> {
    this.logger.debug(`[${this.constructor.name}] Called getRefreshToken()`, 'ea3d2423-ef01-4897-844a-6acc170c423b', {
      parameters,
    });

    if (typeof parameters.refresh_token === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "refresh_token".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "refresh_token"`,
        'f81beada-6951-4a17-a92c-279f3c18d1a0',
        { parameters },
        exc,
      );

      throw exc;
    }

    const refreshToken = await this.refreshTokenService.findOne(parameters.refresh_token);

    if (refreshToken === null) {
      const exc = new InvalidGrantException('Invalid Refresh Token.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Refresh Token`,
        'e308cf51-c9fb-461e-bcd6-3e91ff0b395e',
        null,
        exc,
      );

      throw exc;
    }

    return refreshToken;
  }

  /**
   * Returns the original scopes of the provided Refresh Token or a subset thereof, as requested by the Client.
   *
   * @param parameters Parameters of the Token Request.
   * @param refreshToken Refresh Token provided by the Client.
   * @param client Client of the Request.
   * @returns Scopes of the new Access Token.
   */
  private getScopes(parameters: RefreshTokenTokenRequest, refreshToken: RefreshToken, client: Client): string[] {
    this.logger.debug(`[${this.constructor.name}] Called getScopes()`, '5bfc7fc9-697e-4187-9259-ef383d60a000', {
      parameters,
    });

    if (typeof parameters.scope === 'undefined') {
      return refreshToken.scopes;
    }

    this.scopeHandler.checkRequestedScope(parameters.scope);

    const requestedScopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);

    requestedScopes.forEach((requestedScope) => {
      if (!refreshToken.scopes.includes(requestedScope)) {
        const exc = new InvalidGrantException(`The scope "${requestedScope}" was not previously granted.`);

        this.logger.error(
          `[${this.constructor.name}] The scope "${requestedScope}" was not previously granted`,
          '83f97acd-b875-481f-b6a1-5b9ce33ec1ab',
          null,
          exc,
        );

        throw exc;
      }
    });

    return requestedScopes;
  }
}
