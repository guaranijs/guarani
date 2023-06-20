import { AuthorizationResponse } from './authorization-response';

/**
 * Parameters of the **Code** Authorization Response.
 */
export interface CodeAuthorizationResponse extends AuthorizationResponse {
  /**
   * Authorization Code handle issued to the Client.
   */
  code: string;
}
