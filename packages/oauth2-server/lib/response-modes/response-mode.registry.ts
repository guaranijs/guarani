import { Constructor } from '@guarani/types';

import { ResponseMode } from '../types/response-mode';
import { FormPostResponseMode } from './form-post.response-mode';
import { FragmentResponseMode } from './fragment.response-mode';
import { QueryResponseMode } from './query.response-mode';
import { IResponseMode } from './response-mode.interface';

export const RESPONSE_MODE_REGISTRY: Record<ResponseMode, Constructor<IResponseMode>> = {
  form_post: FormPostResponseMode,
  fragment: FragmentResponseMode,
  query: QueryResponseMode,
};
