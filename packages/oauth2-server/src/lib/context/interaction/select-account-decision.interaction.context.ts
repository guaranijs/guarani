import { Grant } from '../../entities/grant.entity';
import { Login } from '../../entities/login.entity';
import { SelectAccountDecisionInteractionRequest } from '../../requests/interaction/select-account-decision.interaction-request';
import { InteractionContext } from './interaction.context';

/**
 * Parameters of the Select Account Decision Interaction Context.
 */
export interface SelectAccountDecisionInteractionContext
  extends InteractionContext<SelectAccountDecisionInteractionRequest> {
  /**
   * Grant based on the Login Challenge provided by the Client.
   */
  readonly grant: Grant;

  /**
   * Login selected by the End User.
   */
  readonly login: Login;
}
