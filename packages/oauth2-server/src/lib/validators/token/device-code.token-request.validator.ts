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
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param deviceCodeService Instance of the Device Code Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    @Inject(DEVICE_CODE_SERVICE) protected readonly deviceCodeService: DeviceCodeServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[]
  ) {
    super(clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<DeviceCodeTokenContext> {
    const context = await super.validate(request);

    const { parameters } = context;

    const deviceCode = await this.getDeviceCode(parameters);

    return Object.assign(context, { deviceCode }) as DeviceCodeTokenContext;
  }

  /**
   * Fetches the requested Device Code from the application's storage.
   *
   * @param parameters Parameters of the Token Request.
   * @returns Device Code based on the provided Identifier.
   */
  private async getDeviceCode(parameters: DeviceCodeTokenRequest): Promise<DeviceCode> {
    if (typeof parameters.device_code === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "device_code".');
    }

    const deviceCode = await this.deviceCodeService.findOne(parameters.device_code);

    if (deviceCode === null) {
      throw new InvalidGrantException('Invalid Device Code.');
    }

    return deviceCode;
  }
}
