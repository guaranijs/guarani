import { Dict, Nullable } from '@guarani/types';

import { Client } from './entities/client';
import { Response } from './http/response';

/**
 * Adapter interface that contains the common methods used throughout Guarani.
 *
 * These methods are used by multiple authentication methods, endpoints and/or grants and, therefore,
 * to respect the DRY principle, they are defined in this interface.
 *
 * The application **MUST** provide a concrete implementation of the methods defined in this interface.
 */
export interface Adapter {
  /**
   * Searches the application's storage for a Client containing the provided Identifier.
   *
   * @param clientId Identifier of the Client.
   * @returns Client based on the provided Identifier.
   */
  findClient(clientId: string): Promise<Nullable<Client>>;

  /**
   * Renders a HTML Page with the provided parameters.
   *
   * *Note: This method **MUST NOT** raise exceptions.*
   *
   * @param name Name of the Page.
   * @param params Parameters used to render the Page.
   * @returns Rendered Page.
   */
  render(name: string, params: Dict): Promise<Response>;
}
