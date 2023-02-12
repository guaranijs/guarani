import { Constructor } from '@guarani/di';

import { FormPostResponseMode } from './form-post.response-mode';
import { FragmentResponseMode } from './fragment.response-mode';
import { QueryResponseMode } from './query.response-mode';
import { ResponseModeInterface } from './response-mode.interface';
import { ResponseMode } from './response-mode.type';

/**
 * Response Mode Registry.
 */
export const responseModeRegistry: Record<ResponseMode, Constructor<ResponseModeInterface>> = {
  form_post: FormPostResponseMode,
  fragment: FragmentResponseMode,
  query: QueryResponseMode,
};
