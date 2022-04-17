import { Inject, Injectable } from '@guarani/ioc';
import { Optional } from '@guarani/types';

import { ClientEntity } from '../entities/client.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { Request } from '../http/request';
import { AccessTokenService } from '../services/access-token.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { AccessTokenResponse } from '../types/access-token.response';
import { createAccessTokenResponse } from '../utils';
import { GrantType } from './grant-type';
import { RefreshTokenParameters } from './types/refresh-token.parameters';
import { SupportedGrantType } from './types/supported-grant-type';

@Injectable()
export class RefreshTokenGrantType implements GrantType {
  /**
   * Name of the Grant Type.
   */
  public readonly name: SupportedGrantType = 'refresh_token';

  /**
   * Instance of the Access Token Service.
   */
  private readonly accessTokenService: AccessTokenService;

  /**
   * Instance of the Refresh Token Service.
   */
  private readonly refreshTokenService: RefreshTokenService;

  /**
   * Instantiates a new Refresh Token Grant Type.
   *
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    @Inject('AccessTokenService') accessTokenService: AccessTokenService,
    @Inject('RefreshTokenService') refreshTokenService: RefreshTokenService
  ) {
    this.accessTokenService = accessTokenService;
    this.refreshTokenService = refreshTokenService;
  }

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @returns Access Token Response.
   */
  public async createTokenResponse(request: Request, client: ClientEntity): Promise<AccessTokenResponse> {
    const params = <RefreshTokenParameters>request.body;

    this.checkParameters(params);

    const refreshToken = await this.getRefreshToken(params.refresh_token);

    this.checkRefreshToken(refreshToken, client);

    const scopes = this.getScopes(refreshToken, params.scope);

    const { grant, user } = refreshToken;

    // TODO: Add Refresh Token Rotation.
    const accessToken = await this.accessTokenService.createAccessToken(grant, scopes, client, user, refreshToken);

    // TODO: Add policy to revoke the access tokens when using the refresh token.
    return createAccessTokenResponse(accessToken);
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param params Parameters of the Token Request.
   */
  private checkParameters(params: RefreshTokenParameters): void {
    const { refresh_token } = params;

    if (typeof refresh_token !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "refresh_token".' });
    }
  }

  /**
   * Fetches the requested Refresh Token from the application's storage.
   *
   * @param token Token provided by the Client.
   * @returns Refresh Token based on the provided token.
   */
  private async getRefreshToken(token: string): Promise<RefreshTokenEntity> {
    const refreshToken = await this.refreshTokenService.findRefreshToken(token);

    if (refreshToken === undefined) {
      throw new InvalidGrantException({ error_description: 'Invalid Refresh Token.' });
    }

    return refreshToken;
  }

  /**
   * Checks the Refresh Token against the Client of the Token Request.
   *
   * @param refreshToken Refresh Token to be checked.
   * @param client Client of the Request.
   */
  private checkRefreshToken(refreshToken: RefreshTokenEntity, client: ClientEntity): void {
    if (refreshToken.client.id !== client.id) {
      throw new InvalidGrantException({ error_description: 'Mismatching Client Identifier.' });
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new InvalidGrantException({ error_description: 'Expired Refresh Token.' });
    }

    if (refreshToken.isRevoked) {
      throw new InvalidGrantException({ error_description: 'Invalid Refresh Token.' });
    }
  }

  /**
   * Returns the original scopes of the provided Refresh Token or a subset thereof, as requested by the Client.
   *
   * @param refreshToken Refresh Token provided by the Client.
   * @param scope Subset of scopes requested by the Client.
   * @returns Scopes of the new Access Token.
   */
  private getScopes(refreshToken: RefreshTokenEntity, scope?: Optional<string>): string[] {
    if (scope === undefined) {
      return refreshToken.scopes;
    }

    const requestedScopes = scope.split(' ');

    requestedScopes.forEach((requestedScope) => {
      if (!refreshToken.scopes.includes(requestedScope)) {
        throw new InvalidGrantException({
          error_description: `The scope "${requestedScope}" was not previously granted.`,
        });
      }
    });

    return requestedScopes;
  }
}
