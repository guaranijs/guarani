import { Inject, Injectable, InjectAll, Optional } from '@guarani/di';

import { DisplayInterface } from '../../displays/display.interface';
import { DISPLAY } from '../../displays/display.token';
import { Client } from '../../entities/client.entity';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { ClaimsHandler } from '../../handlers/claims.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { Logger } from '../../logger/logger';
import { PkceInterface } from '../../pkces/pkce.interface';
import { PKCE } from '../../pkces/pkce.token';
import { CodeAuthorizationRequest } from '../../requests/authorization/code.authorization-request';
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
import { CodeAuthorizationRequestValidator } from './code.authorization-request.validator';

/**
 * Implementation of the **Code & ID Token** Authorization Request Validator.
 */
@Injectable()
export class CodeIdTokenAuthorizationRequestValidator extends CodeAuthorizationRequestValidator {
  /**
   * Name of the Response Type that uses this Validator.
   */
  public override readonly name: ResponseType = 'code id_token';

  /**
   * Instantiates a new Code & ID Token Authorization Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   * @param pkces PKCE Code Challenge Methods registered at the Authorization Server.
   * @param claimsHandler Instance of the Claims Handler.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) protected override readonly settings: Settings,
    @Inject(CLIENT_SERVICE) protected override readonly clientService: ClientServiceInterface,
    @InjectAll(RESPONSE_MODE) protected override readonly responseModes: ResponseModeInterface[],
    @InjectAll(RESPONSE_TYPE) protected override readonly responseTypes: ResponseTypeInterface[],
    @InjectAll(DISPLAY) protected override readonly displays: DisplayInterface[],
    @InjectAll(PKCE) protected override readonly pkces: PkceInterface[],
    @Optional() protected override readonly claimsHandler?: ClaimsHandler,
  ) {
    super(logger, scopeHandler, settings, clientService, responseModes, responseTypes, displays, pkces, claimsHandler);
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
    parameters: CodeAuthorizationRequest,
    responseType: ResponseTypeInterface,
    client: Client,
  ): ResponseModeInterface {
    this.logger.debug(`[${this.constructor.name}] Called getResponseMode()`, '71033494-f08d-4fb8-89d7-3dbf95a84576', {
      parameters,
      response_type: responseType.name,
      client,
    });

    const responseMode = super.getResponseMode(parameters, responseType, client);

    const forbiddenResponseModes: ResponseMode[] = ['query', 'query.jwt'];

    if (forbiddenResponseModes.includes(responseMode.name)) {
      const exc2 = new InvalidRequestException(
        `Invalid response_mode "${responseMode.name}" for response_type "code id_token".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Invalid response_mode "${responseMode.name}" for response_type "code id_token"`,
        '47305289-5dca-45dd-8187-795c94469f51',
        null,
        exc2,
      );

      throw exc2;
    }

    return responseMode;
  }

  /**
   * Checks and returns the Nonce provided by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @returns Nonce provided by the Client.
   */
  protected override getNonce(parameters: CodeAuthorizationRequest): string {
    this.logger.debug(`[${this.constructor.name}] Called getNonce()`, '1d0babbb-146e-4147-9296-40a289a94ae2', {
      parameters,
    });

    if (typeof parameters.nonce === 'undefined') {
      const exc2 = new InvalidRequestException('Invalid parameter "nonce".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "nonce"`,
        '47671859-b709-499f-9a2f-807663cd1feb',
        { parameters },
        exc2,
      );

      throw exc2;
    }

    return parameters.nonce;
  }
}
