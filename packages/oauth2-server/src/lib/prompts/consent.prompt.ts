import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { PromptInterface } from './prompt.interface';
import { Prompt } from './prompt.type';

@Injectable()
export class ConsentPrompt implements PromptInterface {
  /**
   * Name of the Prompt.
   */
  readonly name: Prompt = 'consent';

  /**
   * Instantiates a new Consent Prompt.
   *
   * @param grantService Instance of the Grant Service.
   * @param consentService Instance of the Consent Service.
   */
  public constructor(
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface
  ) {}

  /**
   * Handles the Grant, Session and Consent of the Authorization Request.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param _client Client requesting authorization.
   * @param grant Grant with the current authorization step.
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the Scopes granted by the End User.
   * @returns Http Error Response or updated Grant, Session and Consent objects.
   */
  public async handle(
    parameters: AuthorizationRequest,
    _client: Client,
    grant: Grant | null,
    session: Session | null,
    consent: Consent | null
  ): Promise<[Grant | null, Session | null, Consent | null]> {
    if (consent !== null) {
      await this.consentService.remove(consent);
      consent = null;
    }

    if (session === null && !parameters.prompt!.includes('login')) {
      if (grant !== null) {
        await this.grantService.remove(grant);
      }

      throw new LoginRequiredException({ state: parameters.state });
    }

    return [grant, session, consent];
  }
}
