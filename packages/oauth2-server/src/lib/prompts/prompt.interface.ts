import { AuthorizationContext } from '../context/authorization/authorization.context';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { Prompt } from './prompt.type';

export interface PromptInterface {
  /**
   * Name of the Prompt.
   */
  readonly name: Prompt;

  /**
   * Handles the Grant, Session and Consent of the Authorization Request.
   *
   * @param context Authorization Request Context.
   * @param grant Grant with the current authorization step.
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the Scopes granted by the End User.
   * @returns Updated Grant, Session and Consent objects.
   */
  handle(
    context: AuthorizationContext<AuthorizationRequest>,
    grant: Grant | null,
    session: Session | null,
    consent: Consent | null
  ): Promise<[Grant | null, Session | null, Consent | null]>;
}
