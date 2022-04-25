import { Client } from '../../entities/client';

/**
 * Parameters used by the application to create the Consent Screen.
 */
export interface ConsentParameters {
  /**
   * Client requesting authorization.
   */
  readonly client: Client;

  /**
   * Scopes requested by the Client.
   */
  readonly scopes: string[];
}
