import { Inject, Injectable, InjectAll } from '@guarani/di';

import { DisplayInterface } from '../../displays/display.interface';
import { DISPLAY } from '../../displays/display.token';
import { Client } from '../../entities/client.entity';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { Logger } from '../../logger/logger';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../../response-modes/response-mode.token';
import { ResponseMode } from '../../response-modes/response-mode.type';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../../response-types/response-type.token';
import { ResponseType } from '../../response-types/response-type.type';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { CLIENT_SERVICE } from '../../services/client.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { AuthorizationRequestValidator } from './authorization-request.validator';

/**
 * Implementation of the **Token** Authorization Request Validator.
 */
@Injectable()
export class TokenAuthorizationRequestValidator extends AuthorizationRequestValidator {
  /**
   * Name of the Response Type that uses this Validator.
   */
  public readonly name: ResponseType = 'token';

  /**
   * Instantiates a new Token Authorization Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) protected override readonly settings: Settings,
    @Inject(CLIENT_SERVICE) protected override readonly clientService: ClientServiceInterface,
    @InjectAll(RESPONSE_MODE) protected override readonly responseModes: ResponseModeInterface[],
    @InjectAll(RESPONSE_TYPE) protected override readonly responseTypes: ResponseTypeInterface[],
    @InjectAll(DISPLAY) protected override readonly displays: DisplayInterface[],
  ) {
    super(logger, scopeHandler, settings, clientService, responseModes, responseTypes, displays);
  }

  /**
   * Retrieves the Response Mode requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param responseType Response Type requested by the Client.
   * @param client Client requesting authorization.
   * @returns Response Mode.
   */
  protected override getResponseMode(
    parameters: AuthorizationRequest,
    responseType: ResponseTypeInterface,
    client: Client,
  ): ResponseModeInterface {
    this.logger.debug(`[${this.constructor.name}] Called getResponseMode()`, 'b995ad3a-8ed3-4a45-81c1-a6bbf9fccd12', {
      parameters,
      response_type: responseType.name,
      client,
    });

    const responseMode = super.getResponseMode(parameters, responseType, client);

    const forbiddenResponseModes: ResponseMode[] = ['query', 'query.jwt'];

    if (forbiddenResponseModes.includes(responseMode.name)) {
      const exc1 = new InvalidRequestException(
        `Invalid response_mode "${responseMode.name}" for response_type "token".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Invalid response_mode "${responseMode.name}" for response_type "token"`,
        '646bfec8-899d-4dd3-a3ce-8e602f5b1fcf',
        null,
        exc1,
      );

      throw exc1;
    }

    return responseMode;
  }
}
