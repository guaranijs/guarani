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
import { RefreshTokenTokenRequest } from '../../requests/token/refresh-token.token-request';
import { RefreshTokenServiceInterface } from '../../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../../services/refresh-token.service.token';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **Refresh Token** Token Request Validator.
 */
@Injectable()
export class RefreshTokenTokenRequestValidator extends TokenRequestValidator<
  RefreshTokenTokenRequest,
  RefreshTokenTokenContext
> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'refresh_token';

  /**
   * Instantiates a new Refresh Token Token Request Validator.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param refreshTokenService Instance of the Refresh Token Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    protected readonly scopeHandler: ScopeHandler,
    @Inject(REFRESH_TOKEN_SERVICE) protected readonly refreshTokenService: RefreshTokenServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[]
  ) {
    super(clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<RefreshTokenTokenContext> {
    const parameters = request.body as RefreshTokenTokenRequest;

    const context = await super.validate(request);

    const refreshToken = await this.getRefreshToken(parameters);
    const scopes = this.getScopes(parameters, refreshToken, context.client);

    return { ...context, refreshToken, scopes };
  }

  /**
   * Fetches the requested Refresh Token from the application's storage.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Refresh Token based on the provided token.
   */
  private async getRefreshToken(parameters: RefreshTokenTokenRequest): Promise<RefreshToken> {
    if (typeof parameters.refresh_token !== 'string') {
      throw new InvalidRequestException('Invalid parameter "refresh_token".');
    }

    const refreshToken = await this.refreshTokenService.findOne(parameters.refresh_token);

    if (refreshToken === null) {
      throw new InvalidGrantException('Invalid Refresh Token.');
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
    if (typeof parameters.scope !== 'undefined' && typeof parameters.scope !== 'string') {
      throw new InvalidRequestException('Invalid parameter "scope".');
    }

    if (typeof parameters.scope === 'undefined') {
      return refreshToken.scopes;
    }

    this.scopeHandler.checkRequestedScope(parameters.scope);

    const requestedScopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);

    requestedScopes.forEach((requestedScope) => {
      if (!refreshToken.scopes.includes(requestedScope)) {
        throw new InvalidGrantException(`The scope "${requestedScope}" was not previously granted.`);
      }
    });

    return requestedScopes;
  }
}
