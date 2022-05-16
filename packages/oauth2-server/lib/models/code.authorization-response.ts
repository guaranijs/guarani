import { AuthorizationResponse } from './authorization-response';

/**
 * Parameters of the Code Authorization Response.
 */
export interface CodeAuthorizationResponse extends AuthorizationResponse {
  /**
   * Authorization Code issued to the Client.
   */
  readonly code: string;
}
