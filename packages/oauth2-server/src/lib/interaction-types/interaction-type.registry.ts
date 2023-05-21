import { Constructor } from '@guarani/di';

import { ConsentInteractionType } from './consent.interaction-type';
import { CreateInteractionType } from './create.interaction-type';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';
import { LoginInteractionType } from './login.interaction-type';
import { LogoutInteractionType } from './logout.interaction-type';
import { SelectAccountInteractionType } from './select-account.interaction-type';

/**
 * Interaction Type Registry.
 */
export const interactionTypeRegistry: Record<InteractionType, Constructor<InteractionTypeInterface>> = {
  consent: ConsentInteractionType,
  create: CreateInteractionType,
  login: LoginInteractionType,
  logout: LogoutInteractionType,
  select_account: SelectAccountInteractionType,
};
