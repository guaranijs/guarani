import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Login Context Interaction Request.
 */
export interface LoginContextInteractionRequest extends InteractionRequest {
  /**
   * Login Challenge provided by the Client.
   */
  readonly login_challenge: string;
}
