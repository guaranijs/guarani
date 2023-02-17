import { Client } from '../entities/client.entity';
import { DeviceCode } from '../entities/device-code.entity';

/**
 * Interface of the Device Code Service.
 *
 * The Device Code Service contains the operations regarding the OAuth 2.0 Device Code.
 */
export interface DeviceCodeServiceInterface {
  /**
   * Creates an Device Code to be exchanged by the Client for an Access Token.
   *
   * @param scopes Scopes requested by the Client.
   * @param client Client requesting authorization.
   * @returns Issued Device Code.
   */
  create(scopes: string[], client: Client): Promise<DeviceCode>;

  /**
   * Searches the application's storage for an Device Code containing the provided Identifier.
   *
   * @param id Identifier of the Device Code.
   * @returns Device Code based on the provided Identifier.
   */
  findOne(id: string): Promise<DeviceCode | null>;

  /**
   * Informs the Authorization Server if it should return a `slow_down` exception to the Client.
   *
   * @param deviceCode Device Code being inspected.
   */
  shouldSlowDown(deviceCode: DeviceCode): Promise<boolean>;

  /**
   * Persists the provided Device Code into the application's storage.
   *
   * @param deviceCode Device Code to be persisted.
   */
  save(deviceCode: DeviceCode): Promise<void>;
}
