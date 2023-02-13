import { Constructor } from '@guarani/di';

import { ConsentInteractionType } from './consent.interaction-type';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';
import { LoginInteractionType } from './login.interaction-type';

/**
 * Interaction Type Registry.
 */
export const interactionTypeRegistry: Record<InteractionType, Constructor<InteractionTypeInterface>> = {
  consent: ConsentInteractionType,
  login: LoginInteractionType,
};
