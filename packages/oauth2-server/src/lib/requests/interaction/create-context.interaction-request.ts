import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Create Context Interaction Request.
 */
export interface CreateContextInteractionRequest extends InteractionRequest {
  /**
   * Login Challenge provided by the Client.
   */
  readonly login_challenge: string;
}
