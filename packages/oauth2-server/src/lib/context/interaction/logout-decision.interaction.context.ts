import { LogoutTicket } from '../../entities/logout-ticket.entity';
import { LogoutDecision } from '../../interaction-types/logout-decision.type';
import { LogoutDecisionInteractionRequest } from '../../requests/interaction/logout-decision.interaction-request';
import { InteractionContext } from './interaction.context';

/**
 * Parameters of the Logout Decision Interaction Context.
 */
export interface LogoutDecisionInteractionContext<TDecision extends LogoutDecision>
  extends InteractionContext<LogoutDecisionInteractionRequest<TDecision>> {
  /**
   * Logout Ticket based on the Logout Challenge provided by the Client.
   */
  readonly logoutTicket: LogoutTicket;

  /**
   * Decision regarding the End User Logout.
   */
  readonly decision: TDecision;
}
