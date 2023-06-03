import { Constructor } from '@guarani/types';

import { AuthorizationContext } from '../../context/authorization/authorization-context';
import { AuthorizationRequest } from '../../requests/authorization/authorization-request';
import { ResponseType } from '../../response-types/response-type.type';
import { AuthorizationRequestValidator } from './authorization-request.validator';
import { CodeIdTokenTokenAuthorizationRequestValidator } from './code-id-token-token.authorization-request.validator';
import { CodeIdTokenAuthorizationRequestValidator } from './code-id-token.authorization-request.validator';
import { CodeTokenAuthorizationRequestValidator } from './code-token.authorization-request.validator';
import { CodeAuthorizationRequestValidator } from './code.authorization-request.validator';
import { IdTokenTokenAuthorizationRequestValidator } from './id-token-token.authorization-request.validator';
import { IdTokenAuthorizationRequestValidator } from './id-token.authorization-request.validator';
import { TokenAuthorizationRequestValidator } from './token.authorization-request.validator';

/**
 * Authorization Request Validators Registry.
 */
export const authorizationRequestValidatorsRegistry: Record<
  ResponseType,
  Constructor<AuthorizationRequestValidator<AuthorizationRequest, AuthorizationContext<AuthorizationRequest>>>
> = {
  code: CodeAuthorizationRequestValidator,
  'code id_token': CodeIdTokenAuthorizationRequestValidator,
  'code id_token token': CodeIdTokenTokenAuthorizationRequestValidator,
  'code token': CodeTokenAuthorizationRequestValidator,
  id_token: IdTokenAuthorizationRequestValidator,
  'id_token token': IdTokenTokenAuthorizationRequestValidator,
  token: TokenAuthorizationRequestValidator,
};
