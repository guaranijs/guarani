import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { RefreshTokenTokenRequest } from '../messages/refresh-token.token-request';
import { TokenResponse } from '../messages/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { createTokenResponse } from '../utils/create-token-response';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

/**
 * Implementation of the **Refresh Token** Grant Type.
 *
 * In this Grant Type the Client requests the Authorization Server for the issuance of a new Access Token
 * without the need to repeat the User Consent process.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-6
 */
@Injectable()
export class RefreshTokenGrantType implements GrantTypeInterface {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'refresh_token';

  /**
   * Instantiates a new Refresh Token Grant Type.
   *
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService: RefreshTokenServiceInterface
  ) {}

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * In this flow the Client uses the Refresh Token received by the Authorization Server as an Authorization Grant
   * to request a new Access Token without the need to trigger a new User Consent process.
   *
   * If the Refresh Token presented is valid, the Authorization Server issues a new Access Token.
   *
   * If **Refresh Token Rotation** is enabled, it issues a new Refresh Token and revokes the provided Refresh Token.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Access Token Response.
   */
  public async handle(parameters: RefreshTokenTokenRequest, client: Client): Promise<TokenResponse> {
    this.checkParameters(parameters);

    let refreshToken = await this.getRefreshToken(parameters.refresh_token);

    this.checkRefreshToken(refreshToken, client);

    const scopes = this.getScopes(refreshToken, parameters.scope);

    const { user } = refreshToken;

    const accessToken = await this.accessTokenService.create(scopes, client, user);

    if (this.settings.enableRefreshTokenRotation) {
      await this.refreshTokenService.revoke(refreshToken);
      refreshToken = await this.refreshTokenService.create(refreshToken.scopes, client, user, accessToken);
    }

    return createTokenResponse(accessToken, refreshToken);
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param parameters Parameters of the Token Request.
   */
  private checkParameters(parameters: RefreshTokenTokenRequest): void {
    const { refresh_token: refreshToken, scope } = parameters;

    if (typeof refreshToken !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "refresh_token".' });
    }

    this.scopeHandler.checkRequestedScope(scope);
  }

  /**
   * Fetches the requested Refresh Token from the application's storage.
   *
   * @param token Token provided by the Client.
   * @returns Refresh Token based on the provided token.
   */
  private async getRefreshToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.refreshTokenService.findOne(token);

    if (refreshToken === null) {
      throw new InvalidGrantException({ description: 'Invalid Refresh Token.' });
    }

    return refreshToken;
  }

  /**
   * Checks the Refresh Token against the Client of the Token Request.
   *
   * @param refreshToken Refresh Token to be checked.
   * @param client Client of the Request.
   */
  private checkRefreshToken(refreshToken: RefreshToken, client: Client): void {
    if (refreshToken.client.id !== client.id) {
      throw new InvalidGrantException({ description: 'Mismatching Client Identifier.' });
    }

    if (new Date() < refreshToken.validAfter) {
      throw new InvalidGrantException({ description: 'Refresh Token not yet valid.' });
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new InvalidGrantException({ description: 'Expired Refresh Token.' });
    }

    if (refreshToken.isRevoked) {
      throw new InvalidGrantException({ description: 'Revoked Refresh Token.' });
    }
  }

  /**
   * Returns the original scopes of the provided Refresh Token or a subset thereof, as requested by the Client.
   *
   * @param refreshToken Refresh Token provided by the Client.
   * @param scope Subset of scopes requested by the Client.
   * @returns Scopes of the new Access Token.
   */
  private getScopes(refreshToken: RefreshToken, scope?: string): string[] {
    if (scope === undefined) {
      return refreshToken.scopes;
    }

    const requestedScopes = scope.split(' ');

    requestedScopes.forEach((requestedScope) => {
      if (!refreshToken.scopes.includes(requestedScope)) {
        throw new InvalidGrantException({ description: `The scope "${requestedScope}" was not previously granted.` });
      }
    });

    return requestedScopes;
  }
}
