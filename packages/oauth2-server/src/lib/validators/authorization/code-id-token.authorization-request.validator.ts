import { Injectable } from '@guarani/di';

import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { ResponseType } from '../../response-types/response-type.type';
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
        description: 'Invalid response_mode "query" for response_type "code id_token".',
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
