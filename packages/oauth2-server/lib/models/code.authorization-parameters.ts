import { Optional } from '@guarani/types';

import { PkceMethod } from '../types/pkce-method';
import { AuthorizationParameters } from './authorization-parameters';

/**
 * Parameters of the Code Authorization Request.
 */
export interface CodeAuthorizationParameters extends AuthorizationParameters {
  /**
   * PKCE Code Challenge.
   */
  readonly code_challenge: string;

  /**
   * PKCE Code Challenge Method.
   */
  readonly code_challenge_method?: Optional<PkceMethod>;
}
