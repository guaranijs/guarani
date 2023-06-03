import { Grant } from '../../entities/grant.entity';
import { LoginDecision } from '../../interaction-types/login-decision.type';
import { LoginDecisionInteractionRequest } from '../../requests/interaction/login-decision.interaction-request';
import { InteractionContext } from './interaction-context';

/**
 * Parameters of the Login Decision Interaction Context.
 */
export interface LoginDecisionInteractionContext<TDecision extends LoginDecision>
  extends InteractionContext<LoginDecisionInteractionRequest<TDecision>> {
  /**
   * Grant based on the Login Challenge provided by the Client.
   */
  readonly grant: Grant;

  /**
   * Decision regarding the End User Authentication.
   */
  readonly decision: TDecision;
}
