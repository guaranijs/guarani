import { Inject, Injectable, InjectAll } from '@guarani/di';

import { DeviceCodeTokenContext } from '../../context/token/device-code.token-context';
import { DeviceCode } from '../../entities/device-code.entity';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { DeviceCodeTokenRequest } from '../../requests/token/device-code.token-request';
import { DeviceCodeServiceInterface } from '../../services/device-code.service.interface';
import { DEVICE_CODE_SERVICE } from '../../services/device-code.service.token';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **Device Code** Token Request Validator.
 */
@Injectable()
export class DeviceCodeTokenRequestValidator extends TokenRequestValidator<DeviceCodeTokenContext> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'urn:ietf:params:oauth:grant-type:device_code';

  /**
   * Instantiates a new Device Code Token Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param deviceCodeService Instance of the Device Code Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    @Inject(DEVICE_CODE_SERVICE) private readonly deviceCodeService: DeviceCodeServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[],
  ) {
    super(logger, clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<DeviceCodeTokenContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '4fcd6a0b-2ebf-4d2a-934f-99e261079489', {
      request,
    });

    const context = await super.validate(request);

    const { parameters } = context;

    const deviceCode = await this.getDeviceCode(parameters);

    Object.assign<DeviceCodeTokenContext, Partial<DeviceCodeTokenContext>>(context, { deviceCode });

    this.logger.debug(
      `[${this.constructor.name}] Device Code Token Request validation completed`,
      '677006cc-4216-475c-a46c-f95d06f2314e',
      { context },
    );

    return context;
  }

  /**
   * Fetches the requested Device Code from the application's storage.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Device Code based on the provided Identifier.
   */
  private async getDeviceCode(parameters: DeviceCodeTokenRequest): Promise<DeviceCode> {
    this.logger.debug(`[${this.constructor.name}] Called getDeviceCode()`, '2dc33706-6672-4f0c-8fe9-94b806d46207', {
      parameters,
    });

    if (typeof parameters.device_code === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "device_code".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "device_code"`,
        '67d61e60-918e-4cdb-bb23-34b72878786c',
        { parameters },
        exc,
      );

      throw exc;
    }

    const deviceCode = await this.deviceCodeService.findOne(parameters.device_code);

    if (deviceCode === null) {
      const exc = new InvalidGrantException('Invalid Device Code.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Device Code`,
        'e037ec74-1056-451d-b24d-7c2fe1578d46',
        null,
        exc,
      );

      throw exc;
    }

    return deviceCode;
  }
}
