import { Inject, Injectable } from '@guarani/di';
import { Optional } from '@guarani/types';

import { AuthorizationServerOptions } from '../authorization-server/options/authorization-server.options';
import { Client } from '../entities/client';
import { RefreshToken } from '../entities/refresh-token';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { RefreshTokenTokenParameters } from '../models/refresh-token.token-parameters';
import { TokenResponse } from '../models/token-response';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { IRefreshTokenService } from '../services/refresh-token.service.interface';
import { GrantType } from '../types/grant-type';
import { createTokenResponse } from '../utils/create-token-response';
import { IGrantType } from './grant-type.interface';

/**
 * Implementation of the **Refresh Token** Grant Type.
 *
 * In this Grant Type the Client requests the Authorization Server for the issuance of a new Access Token
 * without the need to repeat the User Consent process.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-6
 */
@Injectable()
export class RefreshTokenGrantType implements IGrantType {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'refresh_token';

  /**
   * Instantiates a new Refresh Token Grant Type.
   *
   * @param authorizationServerOptions Configuration Parameters of the Authorization Server.
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    @Inject('AuthorizationServerOptions') private readonly authorizationServerOptions: AuthorizationServerOptions,
    private readonly scopeHandler: ScopeHandler,
    @Inject('AccessTokenService') private readonly accessTokenService: IAccessTokenService,
    @Inject('RefreshTokenService') private readonly refreshTokenService: IRefreshTokenService
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
  public async handle(parameters: RefreshTokenTokenParameters, client: Client): Promise<TokenResponse> {
    this.checkParameters(parameters);

    let refreshToken = await this.getRefreshToken(parameters.refresh_token);

    this.checkRefreshToken(refreshToken, client);

    const scopes = this.getScopes(refreshToken, parameters.scope);

    const { user } = refreshToken;

    const accessToken = await this.accessTokenService.createAccessToken(scopes, client, user);

    if (this.authorizationServerOptions.enableRefreshTokenRotation) {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
      refreshToken = await this.refreshTokenService.createRefreshToken(refreshToken.scopes, client, user);
    }

    return createTokenResponse(accessToken, refreshToken);
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param parameters Parameters of the Token Request.
   */
  private checkParameters(parameters: RefreshTokenTokenParameters): void {
    const { refresh_token, scope } = parameters;

    if (typeof refresh_token !== 'string') {
      throw new InvalidRequestException('Invalid parameter "refresh_token".');
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
    const refreshToken = await this.refreshTokenService.findRefreshToken(token);

    if (refreshToken === undefined) {
      throw new InvalidGrantException('Invalid Refresh Token.');
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
      throw new InvalidGrantException('Mismatching Client Identifier.');
    }

    if (new Date() < refreshToken.validAfter) {
      throw new InvalidGrantException('Refresh Token not yet valid.');
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new InvalidGrantException('Expired Refresh Token.');
    }

    if (refreshToken.isRevoked) {
      throw new InvalidGrantException('Revoked Refresh Token.');
    }
  }

  /**
   * Returns the original scopes of the provided Refresh Token or a subset thereof, as requested by the Client.
   *
   * @param refreshToken Refresh Token provided by the Client.
   * @param scope Subset of scopes requested by the Client.
   * @returns Scopes of the new Access Token.
   */
  private getScopes(refreshToken: RefreshToken, scope?: Optional<string>): string[] {
    if (scope === undefined) {
      return refreshToken.scopes;
    }

    const requestedScopes = scope.split(' ');

    requestedScopes.forEach((requestedScope) => {
      if (!refreshToken.scopes.includes(requestedScope)) {
        throw new InvalidGrantException(`The scope "${requestedScope}" was not previously granted.`);
      }
    });

    return requestedScopes;
  }
}
