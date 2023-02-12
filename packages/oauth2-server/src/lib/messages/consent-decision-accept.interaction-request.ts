import { ConsentDecisionInteractionRequest } from './consent-decision.interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Consent Accept Decision Interaction Request.
 */
export interface ConsentDecisionAcceptInteractionRequest extends ConsentDecisionInteractionRequest {
  /**
   * Scope granted by the End User.
   */
  readonly grant_scope: string;
}
