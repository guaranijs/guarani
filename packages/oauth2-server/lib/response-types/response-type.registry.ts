import { Constructor } from '@guarani/types';

import { ResponseType } from '../types/response-type';
import { CodeResponseType } from './code.response-type';
import { IResponseType } from './response-type.interface';
import { TokenResponseType } from './token.response-type';

export const RESPONSE_TYPE_REGISTRY: Record<ResponseType, Constructor<IResponseType>> = {
  code: CodeResponseType,
  token: TokenResponseType,
};
