import { Grant } from '../../entities/grant.entity';
import { LoginDecision } from '../../interaction-types/login-decision.type';
import { InteractionContext } from './interaction-context';

/**
 * Parameters of the Login Decision Interaction Context.
 */
export interface LoginDecisionInteractionContext<TDecision extends LoginDecision> extends InteractionContext {
  /**
   * Grant based on the Login Challenge provided by the Client.
   */
  readonly grant: Grant;

  /**
   * Decision regarding the End User Authentication.
   */
  readonly decision: TDecision;
}
