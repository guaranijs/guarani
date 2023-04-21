import { Inject, Injectable, InjectAll } from '@guarani/di';

import { DisplayInterface } from '../../displays/display.interface';
import { DISPLAY } from '../../displays/display.token';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { ScopeHandler } from '../../handlers/scope.handler';
import { PkceInterface } from '../../pkces/pkce.interface';
import { PKCE } from '../../pkces/pkce.token';
import { PromptInterface } from '../../prompts/prompt.interface';
import { PROMPT } from '../../prompts/prompt.token';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { RESPONSE_MODE } from '../../response-modes/response-mode.token';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { RESPONSE_TYPE } from '../../response-types/response-type.token';
import { ResponseType } from '../../response-types/response-type.type';
import { ClientServiceInterface } from '../../services/client.service.interface';
import { CLIENT_SERVICE } from '../../services/client.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { CodeAuthorizationRequestValidator } from './code.authorization-request.validator';

/**
 * Implementation of the **Code & ID Token & Token** Authorization Request Validator.
 */
@Injectable()
export class CodeIdTokenTokenAuthorizationRequestValidator extends CodeAuthorizationRequestValidator {
  /**
   * Name of the Response Type that uses this Validator.
   */
  public override readonly name: ResponseType = 'code id_token token';

  /**
   * Instantiates a new Code & ID Token & Token Authorization Request Validator.
   *
   * @param scopeHandler Instance of the Scope Handler.
   * @param settings Settings of the Authorization Server.
   * @param clientService Instance of the Client Service.
   * @param responseModes Response Modes registered at the Authorization Server.
   * @param responseTypes Response Types registered at the Authorization Server.
   * @param prompts Prompts registered at the Authorization Server.
   * @param displays Displays registered at the Authorization Server.
   * @param pkces PKCE Code Challenge Methods registered at the Authorization Server.
   */
  public constructor(
    protected override readonly scopeHandler: ScopeHandler,
    @Inject(SETTINGS) protected override readonly settings: Settings,
    @Inject(CLIENT_SERVICE) protected override readonly clientService: ClientServiceInterface,
    @InjectAll(RESPONSE_MODE) protected override readonly responseModes: ResponseModeInterface[],
    @InjectAll(RESPONSE_TYPE) protected override readonly responseTypes: ResponseTypeInterface[],
    @InjectAll(PROMPT) protected override readonly prompts: PromptInterface[],
    @InjectAll(DISPLAY) protected override readonly displays: DisplayInterface[],
    @InjectAll(PKCE) protected override readonly pkces: PkceInterface[]
  ) {
    super(scopeHandler, settings, clientService, responseModes, responseTypes, prompts, displays, pkces);
  }

  /**
   * Retrieves the Response Mode requested by the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param responseType Response Type requested by the Client.
   * @returns Response Mode.
   */
  protected override getResponseMode(
    parameters: AuthorizationRequest,
    responseType: ResponseTypeInterface
  ): ResponseModeInterface {
    const responseMode = super.getResponseMode(parameters, responseType);

    if (responseMode.name === 'query') {
      throw new InvalidRequestException({
        description: 'Invalid response_mode "query" for response_type "code id_token token".',
        state: parameters.state,
      });
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
    if (typeof parameters.nonce !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "nonce".', state: parameters.state });
    }

    return parameters.nonce;
  }
}