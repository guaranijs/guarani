import { Constructor } from '@guarani/di';

import { InteractionType } from '../../interaction-types/interaction-type.type';
import { ConsentInteractionRequestValidator } from './consent.interaction-request.validator';
import { InteractionRequestValidator } from './interaction-request.validator';
import { LoginInteractionRequestValidator } from './login.interaction-request.validator';

/**
 * Interaction Request Validators Registry.
 */
export const interactionRequestValidatorsRegistry: Record<InteractionType, Constructor<InteractionRequestValidator>> = {
  consent: ConsentInteractionRequestValidator,
  login: LoginInteractionRequestValidator,
};
