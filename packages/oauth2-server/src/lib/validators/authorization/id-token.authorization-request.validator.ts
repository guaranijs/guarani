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
 * Implementation of the **ID Token** Authorization Request Validator.
 */
@Injectable()
export class IdTokenAuthorizationRequestValidator extends AuthorizationRequestValidator {
  /**
   * Name of the Response Type that uses this Validator.
   */
  public readonly name: ResponseType = 'id_token';

  /**
   * Instantiates a new ID Token Authorization Request Validator.
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
    this.logger.debug(`[${this.constructor.name}] Called getResponseMode()`, '77304a8d-d56a-4f2c-99ce-88ef75933ab1', {
      parameters,
      response_type: responseType.name,
      client,
    });

    const responseMode = super.getResponseMode(parameters, responseType, client);

    const forbiddenResponseModes: ResponseMode[] = ['query', 'query.jwt'];

    if (forbiddenResponseModes.includes(responseMode.name)) {
      const exc1 = new InvalidRequestException(
        `Invalid response_mode "${responseMode.name}" for response_type "id_token".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Invalid response_mode "${responseMode.name}" for response_type "id_token"`,
        '3fad5d7f-4736-4260-b95a-e67eb137910c',
        null,
        exc1,
      );

      throw exc1;
    }

    return responseMode;
  }

  /**
   * Checks and returns the Nonce provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Nonce provided by the Client.
   */
  protected override getNonce(parameters: AuthorizationRequest): string {
    this.logger.debug(`[${this.constructor.name}] Called getNonce()`, '42bf3068-8a39-4291-8253-d4d26b3af5de', {
      parameters,
    });

    if (typeof parameters.nonce === 'undefined') {
      const exc1 = new InvalidRequestException('Invalid parameter "nonce".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "nonce"`,
        'b47df73e-909f-451d-a6f0-7a2113abe24d',
        { parameters },
        exc1,
      );

      throw exc1;
    }

    return parameters.nonce;
  }
}
