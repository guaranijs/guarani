import { Inject, Injectable } from '@guarani/di';
import { Optional } from '@guarani/types';

import { Client } from '../entities/client';
import { User } from '../entities/user';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { PasswordTokenParameters } from '../models/password.token-parameters';
import { TokenResponse } from '../models/token-response';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { IRefreshTokenService } from '../services/refresh-token.service.interface';
import { IUserService } from '../services/user.service.interface';
import { GrantType } from '../types/grant-type';
import { createTokenResponse } from '../utils/create-token-response';
import { IGrantType } from './grant-type.interface';

/**
 * Implementation of the **Password** Grant Type.
 *
 * In this Grant Type the Client must obtain the **username** and **password** of the End User
 * and present them as the Authorization Grant to the Authorization Server.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.3
 */
@Injectable()
export class PasswordGrantType implements IGrantType {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'password';

  /**
   * Instantiates a new Password Grant Type.
   *
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param userService Instance of the User Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    @Inject('AccessTokenService') private readonly accessTokenService: IAccessTokenService,
    @Inject('UserService') private readonly userService: IUserService,
    @Inject('RefreshTokenService', true) private readonly refreshTokenService?: Optional<IRefreshTokenService>
  ) {
    if (typeof this.userService?.findByResourceOwnerCredentials !== 'function') {
      throw new TypeError('Missing implementation of required method "UserService.findByResourceOwnerCredentials".');
    }
  }

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * In this flow the Authorization Server checks the **username** and **password** provided by the Client
   * on behalf of the End User, checks if the credentials are valid, issues an Access Token and,
   * if allowed to the Client, a Refresh Token.
   *
   * @param parameters Parameters of the Toke Request.
   * @param client Client of the Request.
   * @returns Access Token Response.
   */
  public async handle(parameters: PasswordTokenParameters, client: Client): Promise<TokenResponse> {
    this.checkParameters(parameters);

    const user = await this.getUser(parameters.username, parameters.password);
    const scopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);

    const accessToken = await this.accessTokenService.createAccessToken(scopes, client, user);

    const refreshToken =
      this.refreshTokenService !== undefined && client.grantTypes.includes('refresh_token')
        ? await this.refreshTokenService.createRefreshToken(scopes, client, user)
        : undefined;

    return createTokenResponse(accessToken, refreshToken);
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param parameters Parameters of the Token Request.
   */
  private checkParameters(parameters: PasswordTokenParameters): void {
    const { username, password, scope } = parameters;

    if (typeof username !== 'string') {
      throw new InvalidRequestException('Invalid parameter "username".');
    }

    if (typeof password !== 'string') {
      throw new InvalidRequestException('Invalid parameter "password".');
    }

    this.scopeHandler.checkRequestedScope(scope);
  }

  /**
   * Searches a User from the application's storage based on the provided username and password.
   *
   * @param username Username of the User represented by the Client.
   * @param password Password of the User represented by the Client.
   * @returns User that matches the provided Credentials.
   */
  private async getUser(username: string, password: string): Promise<User> {
    const user = await this.userService.findByResourceOwnerCredentials!(username, password);

    if (user === undefined) {
      throw new InvalidGrantException('Invalid Credentials.');
    }

    return user;
  }
}
