import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { AuthorizationRequest } from '../messages/authorization-request';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { PromptInterface } from './prompt.interface';
import { Prompt } from './prompt.type';

@Injectable()
export class LoginPrompt implements PromptInterface {
  /**
   * Name of the Prompt.
   */
  readonly name: Prompt = 'login';

  /**
   * Instantiates a new Login Prompt.
   *
   * @param grantService Instance of the Grant Service.
   * @param sessionService Instance of the Session Service.
   */
  public constructor(
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface
  ) {}

  /**
   * Handles the Grant, Session and Consent of the Authorization Request.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param _client Client requesting authorization.
   * @param grant Grant with the current authorization step.
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the Scopes granted by the End User.
   * @returns Http Error Response or updated Session and Consent objects.
   */
  public async handle(
    parameters: AuthorizationRequest,
    _client: Client,
    grant: Grant | null,
    session: Session | null,
    consent: Consent | null
  ): Promise<[Grant | null, Session | null, Consent | null]> {
    session ??= grant?.session ?? null;

    if (session !== null) {
      // Discards previous authentication.
      if (grant === null) {
        await this.sessionService.remove(session);
        session = null;
      }

      // Freshly authenticated but not previously authorized.
      else if (consent === null && !parameters.prompt!.includes('consent')) {
        grant.session != null ? await this.sessionService.remove(grant.session) : null;
        await this.grantService.remove(grant);
        throw new ConsentRequiredException({ state: parameters.state });
      }
    }

    return [grant, session, consent];
  }
}
