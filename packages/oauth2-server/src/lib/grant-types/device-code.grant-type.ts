import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';

import { Inject, Injectable, Optional } from '@guarani/di';

import { DeviceCodeTokenContext } from '../context/token/device-code.token-context';
import { Client } from '../entities/client.entity';
import { DeviceCode } from '../entities/device-code.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AuthorizationPendingException } from '../exceptions/authorization-pending.exception';
import { ExpiredTokenException } from '../exceptions/expired-token.exception';
import { SlowDownException } from '../exceptions/slow-down.exception';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { DeviceCodeServiceInterface } from '../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../services/device-code.service.token';
import { RefreshTokenServiceInterface } from '../services/refresh-token.service.interface';
import { REFRESH_TOKEN_SERVICE } from '../services/refresh-token.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

/**
 * Implementation of the **Device Code** Grant Type.
 *
 * In this Grant Type the Client obtains a Device Code from the Device Authorization Endpoint
 * and exchanges it for an Access Token.
 *
 * This Grant Types expects a pooling behaviour from the Client when issuing an Access Token.
 *
 * @see https://www.rfc-editor.org/rfc/rfc8628.html#section-3.4
 * @see https://www.rfc-editor.org/rfc/rfc8628.html#section-3.5
 */
@Injectable()
export class DeviceCodeGrantType implements GrantTypeInterface {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'urn:ietf:params:oauth:grant-type:device_code';

  /**
   * Instantiates a new Device Code Grant Type.
   *
   * @param deviceCodeService Instance of the Device Code Service.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    @Inject(DEVICE_CODE_SERVICE) private readonly deviceCodeService: DeviceCodeServiceInterface,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Optional() @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService: RefreshTokenServiceInterface,
  ) {}

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * In this flow the Client polls the Token Endpoint with the `device_code` obtained
   * at the Device Authorization Endpoint. It keeps polling until the User decides to grant
   * or deny authorization to the Client.
   *
   * The means for the User to make a decision is left at the discretion of the application.
   *
   * @param context Token Request Context.
   * @returns Access Token Response.
   */
  public async handle(context: DeviceCodeTokenContext): Promise<TokenResponse> {
    const { client, deviceCode } = context;

    await this.checkDeviceCode(deviceCode, client);

    const { scopes, user } = deviceCode;

    const accessToken = await this.accessTokenService.create(scopes, client, user!);

    const refreshToken =
      typeof this.refreshTokenService !== 'undefined' && client.grantTypes.includes('refresh_token')
        ? await this.refreshTokenService.create(scopes, client, user!, accessToken)
        : null;

    return createTokenResponse(accessToken, refreshToken);
  }

  /**
   * Checks the provided Device Code to see if it has been authorized by an End User.
   *
   * If it was denied or not yet decided, it throws the respective exception to be returned to the Client.
   *
   * @param deviceCode Device Code being inspected.
   * @param client Client requesting authorization.
   */
  private async checkDeviceCode(deviceCode: DeviceCode, client: Client): Promise<void> {
    const deviceCodeClientId = Buffer.from(deviceCode.client.id, 'utf8');
    const clientId = Buffer.from(client.id, 'utf8');

    if (deviceCodeClientId.length !== clientId.length || !timingSafeEqual(deviceCodeClientId, clientId)) {
      deviceCode.isAuthorized = false;
      await this.deviceCodeService.save(deviceCode);
      throw new AccessDeniedException('Authorization denied by the Authorization Server.');
    }

    if (new Date() >= deviceCode.expiresAt) {
      throw new ExpiredTokenException('Expired Device Code.');
    }

    if (deviceCode.isAuthorized === null) {
      throw (await this.deviceCodeService.shouldSlowDown(deviceCode))
        ? new SlowDownException()
        : new AuthorizationPendingException();
    }

    if (!deviceCode.isAuthorized) {
      throw new AccessDeniedException('Authorization denied by the User.');
    }
  }
}
