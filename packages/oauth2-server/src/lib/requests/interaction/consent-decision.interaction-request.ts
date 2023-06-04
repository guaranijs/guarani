import { ConsentDecision } from '../../interaction-types/consent-decision.type';
import { InteractionRequest } from './interaction-request';

/**
 * Parameters of the custom OAuth 2.0 Consent Decision Interaction Request.
 */
export interface ConsentDecisionInteractionRequest<TDecision extends ConsentDecision = ConsentDecision>
  extends InteractionRequest {
  /**
   * Consent Challenge provided by the Client.
   */
  readonly consent_challenge: string;

  /**
   * Decision regarding the Consent to the requested scope.
   */
  readonly decision: TDecision;
}
