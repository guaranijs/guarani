import { Inject, Injectable, Optional } from '@guarani/di';

import { ResourceOwnerPasswordCredentialsTokenContext } from '../context/token/resource-owner-password-credentials.token.context';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
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
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService?: RefreshTokenServiceInterface
  ) {}

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * In this flow the Authorization Server checks the **username** and **password** provided by the Client
   * on behalf of the End User, checks if the credentials are valid, issues an Access Token and,
   * if allowed to the Client, a Refresh Token.
   *
   * @param context Token Request Context.
   * @returns Access Token Response.
   */
  public async handle(context: ResourceOwnerPasswordCredentialsTokenContext): Promise<TokenResponse> {
    const { client, scopes, user } = context;

    const accessToken = await this.accessTokenService.create(scopes, client, user);

    const refreshToken = client.grantTypes.includes('refresh_token')
      ? await this.refreshTokenService?.create(scopes, client, user, accessToken)
      : undefined;

    return createTokenResponse(accessToken, refreshToken);
  }
}
