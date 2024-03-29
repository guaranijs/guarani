import { Constructor } from '@guarani/types';

import { InteractionType } from '../../interaction-types/interaction-type.type';
import { ConsentInteractionRequestValidator } from './consent.interaction-request.validator';
import { CreateInteractionRequestValidator } from './create.interaction-request.validator';
import { InteractionRequestValidator } from './interaction-request.validator';
import { LoginInteractionRequestValidator } from './login.interaction-request.validator';
import { LogoutInteractionRequestValidator } from './logout.interaction-request.validator';
import { SelectAccountInteractionRequestValidator } from './select-account.interaction-request.validator';

/**
 * Interaction Request Validators Registry.
 */
export const interactionRequestValidatorsRegistry: Record<InteractionType, Constructor<InteractionRequestValidator>> = {
  consent: ConsentInteractionRequestValidator,
  create: CreateInteractionRequestValidator,
  login: LoginInteractionRequestValidator,
  logout: LogoutInteractionRequestValidator,
  select_account: SelectAccountInteractionRequestValidator,
};
