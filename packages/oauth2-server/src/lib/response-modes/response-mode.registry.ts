import { Constructor } from '@guarani/types';

import { FormPostResponseMode } from './form-post.response-mode';
import { FormPostJwtResponseMode } from './form-post-jwt.response-mode';
import { FragmentResponseMode } from './fragment.response-mode';
import { FragmentJwtResponseMode } from './fragment-jwt.response-mode';
import { JwtResponseMode } from './jwt.response-mode';
import { QueryResponseMode } from './query.response-mode';
import { QueryJwtResponseMode } from './query-jwt.response-mode';
import { ResponseModeInterface } from './response-mode.interface';
import { ResponseMode } from './response-mode.type';

/**
 * Response Mode Registry.
 */
export const responseModeRegistry: Record<ResponseMode, Constructor<ResponseModeInterface>> = {
  'form_post.jwt': FormPostJwtResponseMode,
  'fragment.jwt': FragmentJwtResponseMode,
  'query.jwt': QueryJwtResponseMode,
  form_post: FormPostResponseMode,
  fragment: FragmentResponseMode,
  jwt: JwtResponseMode, // this is never called as the validator reassigns the original value
  query: QueryResponseMode,
};
