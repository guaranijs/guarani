import { Optional } from '@guarani/types';

/**
 * Parameters of the Authorization Code Response.
 */
export interface AuthorizationCodeResponse {
  /**
   * Authorization Code issued to the Client.
   */
  readonly code: string;

  /**
   * State of the Client Application prior to the Authorization Request.
   */
  readonly state?: Optional<string>;
}
