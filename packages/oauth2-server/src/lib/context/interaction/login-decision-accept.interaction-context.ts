import { Nullable } from '@guarani/types';

import { User } from '../../entities/user.entity';
import { LoginDecisionInteractionContext } from './login-decision.interaction-context';

/**
 * Parameters of the Login Decision Accept Interaction Context.
 */
export interface LoginDecisionAcceptInteractionContext extends LoginDecisionInteractionContext<'accept'> {
  /**
   * User to be authenticated.
   */
  readonly user: User;

  /**
   * Authentication Methods used in the Authentication.
   */
  readonly amr: string[];

  /**
   * Authentication Context Class Reference satisfied by the Authentication process.
   */
  readonly acr: Nullable<string>;
}
