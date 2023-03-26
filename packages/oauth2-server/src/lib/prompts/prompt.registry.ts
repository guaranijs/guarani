import { Constructor } from '@guarani/di';

import { Prompt } from './prompt.type';
import { NonePrompt } from './none.prompt';
import { LoginPrompt } from './login.prompt';
import { ConsentPrompt } from './consent.prompt';
import { PromptInterface } from './prompt.interface';

/**
 * Prompts Registry.
 *
 * *note: the prompts must appear in their logical orders of the authorization process.*
 */
export const promptRegistry: Record<Prompt, Constructor<PromptInterface>> = {
  none: NonePrompt,
  login: LoginPrompt,
  consent: ConsentPrompt,
};
