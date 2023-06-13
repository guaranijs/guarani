import { URLSearchParams } from 'url';

import { Client } from '../entities/client.entity';

/**
 * Parameters of the Device Authorization Context.
 */
export interface DeviceAuthorizationContext {
  /**
   * Parameters of the Device Authorization Request.
   */
  readonly parameters: URLSearchParams;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];
}
