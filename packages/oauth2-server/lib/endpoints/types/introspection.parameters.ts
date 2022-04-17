import { Optional } from '@guarani/types';

import { SupportedTokenTypeHint } from '../../types/supported-token-type-hint';

/**
 * Parameters of the Introspection Endpoint.
 */
export interface IntrospectionParameters {
  /**
   * Token to be introspected.
   */
  readonly token: string;

  /**
   * Optional hint about the type of the Token.
   */
  readonly token_type_hint?: Optional<SupportedTokenTypeHint>;
}
