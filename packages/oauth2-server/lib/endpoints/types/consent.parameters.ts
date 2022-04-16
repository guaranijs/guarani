import { ClientEntity } from '../../entities/client.entity';

/**
 * Parameters used by the application to create the Consent Screen.
 */
export interface ConsentParameters {
  /**
   * Client requesting authorization.
   */
  readonly client: ClientEntity;

  /**
   * Scopes requested by the Client.
   */
  readonly scopes: string[];
}
