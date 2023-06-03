import { Inject, Injectable } from '@guarani/di';

import { RefreshTokenTokenContext } from '../context/token/refresh-token.token-context';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { TokenResponse } from '../responses/token-response';
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
   * @param settings Settings of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService: RefreshTokenServiceInterface
  ) {
    if (this.settings.enableRefreshTokenRotation && typeof this.refreshTokenService.rotate !== 'function') {
      throw new TypeError('Missing implementation of required method "RefreshTokenServiceInterface.rotate".');
    }
  }

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
   * @param context Token Request Context.
   * @returns Access Token Response.
   */
  public async handle(context: RefreshTokenTokenContext): Promise<TokenResponse> {
    let { client, refreshToken, scopes } = context;

    this.checkRefreshToken(refreshToken, client);

    const { user } = refreshToken;

    const accessToken = await this.accessTokenService.create(scopes, client, user);

    if (this.settings.enableRefreshTokenRotation) {
      refreshToken = await this.refreshTokenService.rotate!(refreshToken);
    }

    return createTokenResponse(accessToken, refreshToken);
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
}
