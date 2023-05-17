import { LogoutTicket } from '../../entities/logout-ticket.entity';
import { LogoutContextInteractionRequest } from '../../requests/interaction/logout-context.interaction-request';
import { InteractionContext } from './interaction.context';

/**
 * Parameters of the Logout Context Interaction Context.
 */
export interface LogoutContextInteractionContext extends InteractionContext<LogoutContextInteractionRequest> {
  /**
   * Logout Ticket based on the Logout Challenge provided by the Client.
   */
  readonly logoutTicket: LogoutTicket;
}
