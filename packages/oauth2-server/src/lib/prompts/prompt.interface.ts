import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { AuthorizationRequest } from '../messages/authorization-request';
import { Prompt } from './prompt.type';

export interface PromptInterface {
  /**
   * Name of the Prompt.
   */
  readonly name: Prompt;

  /**
   * Handles the Grant, Session and Consent of the Authorization Request.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client requesting authorization.
   * @param grant Grant with the current authorization step.
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the Scopes granted by the End User.
   * @returns Http Error Response or updated Grant, Session and Consent objects.
   */
  handle(
    parameters: AuthorizationRequest,
    client: Client,
    grant: Grant | null,
    session: Session | null,
    consent: Consent | null
  ): Promise<[Grant | null, Session | null, Consent | null]>;
}
