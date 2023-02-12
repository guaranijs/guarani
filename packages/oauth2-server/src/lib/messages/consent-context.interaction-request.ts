import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Consent Context Interaction Request.
 */
export interface ConsentContextInteractionRequest extends InteractionRequest {
  /**
   * Consent Challenge.
   */
  readonly consent_challenge: string;
}
