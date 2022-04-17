import { Inject, Injectable } from '@guarani/ioc';

import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { Request } from '../http/request';
import { AccessTokenService } from '../services/access-token.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { UserService } from '../services/user.service';
import { AccessTokenResponse } from '../types/access-token.response';
import { createAccessTokenResponse, getAllowedScopes } from '../utils';
import { GrantType } from './grant-type';
import { PasswordParameters } from './types/password.parameters';
import { SupportedGrantType } from './types/supported-grant-type';

/**
 * Implementation of the Resource Owner Password Credentials Grant Type.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.3
 *
 * In this Grant Type the Client must obtain the **username** and **password** of the End User
 * and present them as the Authorization Grant to the Authorization Server.
 */
@Injectable()
export class PasswordGrantType implements GrantType {
  /**
   * Name of the Grant Type.
   */
  public readonly name: SupportedGrantType = 'password';

  /**
   * Instance of the User Service.
   */
  private readonly userService: UserService;

  /**
   * Instance of the Access Token Service.
   */
  private readonly accessTokenService: AccessTokenService;

  /**
   * Instance of the Refresh Token Service.
   */
  private readonly refreshTokenService: RefreshTokenService;

  /**
   * Instantiates a new Password Grant Type.
   *
   * @param userService Instance of the User Service.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    @Inject('UserService') userService: UserService,
    @Inject('AccessTokenService') accessTokenService: AccessTokenService,
    @Inject('RefreshTokenService') refreshTokenService: RefreshTokenService
  ) {
    this.userService = userService;
    this.accessTokenService = accessTokenService;
    this.refreshTokenService = refreshTokenService;
  }

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * In this flow the Authorization Server checks the **username** and **password** provided by the Client
   * on behalf of the End User, checks if the credentials are valid, issues an Access Token and,
   * if allowed to the Client, a Refresh Token.
   *
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @returns Access Token Response.
   */
  public async createTokenResponse(request: Request, client: ClientEntity): Promise<AccessTokenResponse> {
    const params = <PasswordParameters>request.body;

    this.checkParameters(params);

    const scopes = params.scope !== undefined ? getAllowedScopes(client, params.scope) : client.scopes;
    const user = await this.authenticate(params.username, params.password);

    const refreshToken = client.grantTypes.includes('refresh_token')
      ? await this.refreshTokenService.createRefreshToken(this.name, scopes, client, user)
      : undefined;

    const accessToken = await this.accessTokenService.createAccessToken(this.name, scopes, client, user, refreshToken);

    return createAccessTokenResponse(accessToken);
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param params Parameters of the Token Request.
   */
  private checkParameters(params: PasswordParameters): void {
    const { username, password } = params;

    if (typeof username !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "username".' });
    }

    if (typeof password !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "password".' });
    }
  }

  /**
   * Searches and authenticates a User from the application's storage based on the provided username and password.
   *
   * @param username Username of the User represented by the Client.
   * @param password Password of the User represented by the Client.
   * @returns Authenticated User.
   */
  private async authenticate(username: string, password: string): Promise<UserEntity> {
    const user = await this.userService.authenticate(username, password);

    if (user === undefined) {
      throw new InvalidGrantException({ error_description: 'Invalid Credentials.' });
    }

    return user;
  }
}
