import { Grant } from '../../entities/grant.entity';
import { ConsentDecision } from '../../interaction-types/consent-decision.type';
import { ConsentDecisionInteractionRequest } from '../../requests/interaction/consent-decision.interaction-request';
import { InteractionContext } from './interaction-context';

/**
 * Parameters of the Consent Decision Interaction Context.
 */
export interface ConsentDecisionInteractionContext<TDecision extends ConsentDecision>
  extends InteractionContext<ConsentDecisionInteractionRequest<TDecision>> {
  /**
   * Grant based on the Consent Challenge provided by the Client.
   */
  readonly grant: Grant;

  /**
   * Decision regarding the Consent to the requested scope.
   */
  readonly decision: TDecision;
}
