import { Injectable } from '@guarani/di';

import { AuthorizationContext } from '../../context/authorization/authorization.context';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseModeInterface } from '../../response-modes/response-mode.interface';
import { ResponseTypeInterface } from '../../response-types/response-type.interface';
import { ResponseType } from '../../response-types/response-type.type';
import { AuthorizationRequestValidator } from './authorization-request.validator';

/**
 * Implementation of the **Token** Authorization Request Validator.
 */
@Injectable()
export class TokenAuthorizationRequestValidator extends AuthorizationRequestValidator<
  AuthorizationRequest,
  AuthorizationContext<AuthorizationRequest>
> {
  /**
   * Name of the Response Type that uses this Validator.
   */
  public readonly name: ResponseType = 'token';

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
        description: 'Invalid response_mode "query" for response_type "token".',
        state: parameters.state,
      });
    }

    return responseMode;
  }
}
