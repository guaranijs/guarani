import { Constructor } from '@guarani/di';

import { CodeResponseType } from './code.response-type';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';
import { TokenResponseType } from './token.response-type';

/**
 * Response Type Registry.
 */
export const responseTypeRegistry: Record<ResponseType, Constructor<ResponseTypeInterface>> = {
  code: CodeResponseType,
  token: TokenResponseType,
};
