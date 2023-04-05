import { ConsentDecisionInteractionRequest } from './consent-decision.interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Consent Decision Deny Interaction Request.
 */
export interface ConsentDecisionDenyInteractionRequest extends ConsentDecisionInteractionRequest {
  /**
   * Error Code.
   */
  readonly error: string;

  /**
   * Description of the Error.
   */
  readonly error_description: string;
}
