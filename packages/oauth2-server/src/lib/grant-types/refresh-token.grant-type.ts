import { Inject, Injectable } from '@guarani/di';

import { RefreshTokenTokenContext } from '../context/token/refresh-token.token-context';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { InvalidGrantException } from '../exceptions/invalid-grant.exception';
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService: RefreshTokenServiceInterface,
  ) {
    if (this.settings.enableRefreshTokenRotation && typeof this.refreshTokenService.rotate !== 'function') {
      const exc = new TypeError('Missing implementation of required method "RefreshTokenServiceInterface.rotate".');

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "RefreshTokenServiceInterface.rotate"`,
        'e801b755-f734-47c2-b0f5-6aeebe7993c2',
        null,
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called handle()`, 'bf77804e-9233-40c1-a7da-8906011f8a25', {
      context,
    });

    let { client, refreshToken, scopes } = context;

    this.checkRefreshToken(refreshToken, client);

    const { user } = refreshToken;

    const accessToken = await this.accessTokenService.create(scopes, client, user);

    if (this.settings.enableRefreshTokenRotation) {
      refreshToken = await this.refreshTokenService.rotate!(refreshToken);
    }

    const response = createTokenResponse(accessToken, refreshToken);

    this.logger.debug(
      `[${this.constructor.name}] Refresh Token Grant completed`,
      '257bcc8c-fa4b-4068-91ba-b64c413fd478',
      { response },
    );

    return response;
  }

  /**
   * Checks the Refresh Token against the Client of the Token Request.
   *
   * @param refreshToken Refresh Token to be checked.
   * @param client Client of the Request.
   */
  private checkRefreshToken(refreshToken: RefreshToken, client: Client): void {
    if (refreshToken.client.id !== client.id) {
      const exc = new InvalidGrantException('Mismatching Client Identifier.');

      this.logger.error(
        `[${this.constructor.name}] Mismatching Client Identifier`,
        '84ca7dde-d9aa-4169-aa37-ea758facb3c4',
        { refresh_token: refreshToken, client },
        exc,
      );

      throw exc;
    }

    if (new Date() < refreshToken.validAfter) {
      const exc = new InvalidGrantException('Refresh Token not yet valid.');

      this.logger.error(
        `[${this.constructor.name}] Refresh Token not yet valid`,
        '9f576636-3175-4b0b-94cd-b58a8a46f471',
        { refresh_token: refreshToken },
        exc,
      );

      throw exc;
    }

    if (new Date() > refreshToken.expiresAt) {
      const exc = new InvalidGrantException('Expired Refresh Token.');

      this.logger.error(
        `[${this.constructor.name}] Expired Refresh Token`,
        '8993e731-ab0f-4e95-93e4-e98c9f3ece55',
        { refresh_token: refreshToken },
        exc,
      );

      throw exc;
    }

    if (refreshToken.isRevoked) {
      const exc = new InvalidGrantException('Revoked Refresh Token.');

      this.logger.error(
        `[${this.constructor.name}] Revoked Refresh Token`,
        'b4a9ed5f-b13c-49cc-abf3-2ca0b0a64cd0',
        { refresh_token: refreshToken },
        exc,
      );

      throw exc;
    }
  }
}
