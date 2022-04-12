import { Optional } from '@guarani/types';

import { SupportedPkceMethod } from '../../pkce/types/supported-pkce-method';
import { AuthorizationParameters } from './authorization.parameters';

/**
 * Parameters of the Authorization Request of the Authorization Code Response Type.
 */
export interface AuthorizationCodeParameters extends AuthorizationParameters {
  /**
   * PKCE Code Challenge.
   */
  readonly code_challenge: string;

  /**
   * PKCE Code Challenge Method.
   */
  readonly code_challenge_method?: Optional<SupportedPkceMethod>;
}
