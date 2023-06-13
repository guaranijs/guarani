import { LogoutTicket } from '../../entities/logout-ticket.entity';
import { LogoutDecision } from '../../interaction-types/logout-decision.type';
import { InteractionContext } from './interaction-context';

/**
 * Parameters of the Logout Decision Interaction Context.
 */
export interface LogoutDecisionInteractionContext<TDecision extends LogoutDecision> extends InteractionContext {
  /**
   * Logout Ticket based on the Logout Challenge provided by the Client.
   */
  readonly logoutTicket: LogoutTicket;

  /**
   * Decision regarding the End User Logout.
   */
  readonly decision: TDecision;
}
