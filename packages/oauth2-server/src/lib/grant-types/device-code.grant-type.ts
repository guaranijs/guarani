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
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param deviceCodeService Instance of the Device Code Service.
   * @param accessTokenService Instance of the Access Token Service.
   * @param refreshTokenService Instance of the Refresh Token Service.
   */
  public constructor(
    private readonly logger: Logger,
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
    this.logger.debug(`[${this.constructor.name}] Called handle()`, 'a81764e3-1acf-4af0-88af-eb4a58c79e59', {
      context,
    });

    const { client, deviceCode } = context;

    await this.checkDeviceCode(deviceCode, client);

    const { scopes, user } = deviceCode;

    const accessToken = await this.accessTokenService.create(scopes, client, user!);

    const refreshToken =
      typeof this.refreshTokenService !== 'undefined' && client.grantTypes.includes('refresh_token')
        ? await this.refreshTokenService.create(scopes, client, user!, accessToken)
        : null;

    const response = createTokenResponse(accessToken, refreshToken);

    this.logger.debug(
      `[${this.constructor.name}] Device Code Grant completed`,
      '1bfb300c-d6f9-42aa-bc00-babaa43115ab',
      { response },
    );

    return response;
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
    this.logger.debug(`[${this.constructor.name}] Called checkDeviceCode()`, '14340fd8-dfa2-4aed-8fd0-2b6fb4b8b0bc', {
      device_code: deviceCode,
      client,
    });

    const deviceCodeClientId = Buffer.from(deviceCode.client.id, 'utf8');
    const clientId = Buffer.from(client.id, 'utf8');

    if (deviceCodeClientId.length !== clientId.length || !timingSafeEqual(deviceCodeClientId, clientId)) {
      deviceCode.isAuthorized = false;

      await this.deviceCodeService.save(deviceCode);

      const exc = new AccessDeniedException('Authorization denied by the Authorization Server.');

      this.logger.error(
        `[${this.constructor.name}] Authorization denied by the Authorization Server`,
        '045dc633-e514-4a5f-923f-cd7ec1a3337d',
        { device_code: deviceCode, client },
        exc,
      );

      throw exc;
    }

    if (new Date() >= deviceCode.expiresAt) {
      const exc = new ExpiredTokenException('Expired Device Code.');

      this.logger.error(
        `[${this.constructor.name}] Expired Device Code`,
        '71516abb-06df-4253-b47c-0044b0666c98',
        { device_code: deviceCode },
        exc,
      );

      throw exc;
    }

    if (deviceCode.isAuthorized === null) {
      const exc = (await this.deviceCodeService.shouldSlowDown(deviceCode))
        ? new SlowDownException()
        : new AuthorizationPendingException();

      this.logger.error(
        `[${this.constructor.name}] Device Code not yet authorized`,
        'af9f8d95-0393-4114-b0d5-984f8683acdb',
        { device_code: deviceCode },
        exc,
      );

      throw exc;
    }

    if (!deviceCode.isAuthorized) {
      const exc = new AccessDeniedException('Authorization denied by the User.');

      this.logger.error(
        `[${this.constructor.name}] Authorization denied by the User`,
        '75f28067-434d-495e-906d-95982b88a7c2',
        { device_code: deviceCode },
        exc,
      );

      throw exc;
    }
  }
}
