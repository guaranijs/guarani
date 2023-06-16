import { Client } from '../entities/client.entity';
import { DeviceAuthorizationRequest } from '../requests/device-authorization-request';

/**
 * Parameters of the Device Authorization Context.
 */
export interface DeviceAuthorizationContext {
  /**
   * Parameters of the Device Authorization Request.
   */
  readonly parameters: DeviceAuthorizationRequest;

  /**
   * Client of the Request.
   */
  readonly client: Client;

  /**
   * Scopes granted to the Client.
   */
  readonly scopes: string[];
}
