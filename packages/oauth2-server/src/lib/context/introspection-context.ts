import { Nullable } from '@guarani/types';

import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IntrospectionRequest } from '../requests/introspection-request';
import { TokenTypeHint } from '../types/token-type-hint.type';

/**
 * Parameters of the Introspection Context.
 */
export interface IntrospectionContext {
  /**
   * Parameters of the Introspection Request.
   */
  readonly parameters: IntrospectionRequest;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Instance of the Token provided by the Client.
   */
  readonly token: Nullable<AccessToken | RefreshToken>;

  /**
   * Type of the Token provided by the Client.
   */
  readonly tokenType: Nullable<TokenTypeHint>;
}
