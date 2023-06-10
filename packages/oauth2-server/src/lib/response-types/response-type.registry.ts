import { Constructor } from '@guarani/types';

import { CodeResponseType } from './code.response-type';
import { CodeIdTokenResponseType } from './code-id-token.response-type';
import { CodeIdTokenTokenResponseType } from './code-id-token-token.response-type';
import { CodeTokenResponseType } from './code-token.response-type';
import { IdTokenResponseType } from './id-token.response-type';
import { IdTokenTokenResponseType } from './id-token-token.response-type';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';
import { TokenResponseType } from './token.response-type';

/**
 * Response Type Registry.
 */
export const responseTypeRegistry: Record<ResponseType, Constructor<ResponseTypeInterface>> = {
  code: CodeResponseType,
  'code id_token': CodeIdTokenResponseType,
  'code id_token token': CodeIdTokenTokenResponseType,
  'code token': CodeTokenResponseType,
  id_token: IdTokenResponseType,
  'id_token token': IdTokenTokenResponseType,
  token: TokenResponseType,
};
