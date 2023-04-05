import { Inject, Injectable, Optional } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { User } from '../entities/user.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../requests/token/resource-owner-password-credentials.token-request';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

/**
 * Implementation of the **Resource Owner Password Credentials** Grant Type.
 *
 * In this Grant Type the Client must obtain the **username** and **password** of the End User
 * and present them as the Authorization Grant to the Authorization Server.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.3
 */
@Injectable()
export class ResourceOwnerPasswordCredentialsGrantType implements GrantTypeInterface {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'password';

  /**
   * Instantiates a new Resource Owner Password Credentials Grant Type.
   *
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param userService Instance of the User Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService?: RefreshTokenServiceInterface
  ) {
    if (typeof this.userService.findByResourceOwnerCredentials !== 'function') {
      throw new TypeError(
        'Missing implementation of required method "UserServiceInterface.findByResourceOwnerCredentials".'
      );
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
  public async handle(
    parameters: ResourceOwnerPasswordCredentialsTokenRequest,
    client: Client
  ): Promise<TokenResponse> {
    this.checkParameters(parameters);

    const user = await this.getUser(parameters.username, parameters.password);
    const scopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);

    const accessToken = await this.accessTokenService.create(scopes, client, user);

    const refreshToken = client.grantTypes.includes('refresh_token')
      ? await this.refreshTokenService?.create(scopes, client, user, accessToken)
      : undefined;

    return createTokenResponse(accessToken, refreshToken);
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param parameters Parameters of the Token Request.
   */
  private checkParameters(parameters: ResourceOwnerPasswordCredentialsTokenRequest): void {
    const { username, password, scope } = parameters;

    if (typeof username !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "username".' });
    }

    if (typeof password !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "password".' });
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

    if (user === null) {
      throw new InvalidGrantException({ description: 'Invalid Credentials.' });
    }

    return user;
  }
}
