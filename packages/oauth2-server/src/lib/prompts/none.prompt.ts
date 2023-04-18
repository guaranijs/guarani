import { Inject, Injectable } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization.context';
import { Consent } from '../entities/consent.entity';
import { Grant } from '../entities/grant.entity';
import { Session } from '../entities/session.entity';
import { ConsentRequiredException } from '../exceptions/consent-required.exception';
import { LoginRequiredException } from '../exceptions/login-required.exception';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ConsentServiceInterface } from '../services/consent.service.interface';
import { CONSENT_SERVICE } from '../services/consent.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { PromptInterface } from './prompt.interface';
import { Prompt } from './prompt.type';

@Injectable()
export class NonePrompt implements PromptInterface {
  /**
   * Name of the Prompt.
   */
  public readonly name: Prompt = 'none';

  /**
   * Instantiates a new None Prompt.
   *
   * @param sessionService Instance of the Session Service.
   * @param consentService Instance of the Consent Service.
   */
  public constructor(
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(CONSENT_SERVICE) private readonly consentService: ConsentServiceInterface
  ) {}

  /**
   * Handles the Session and Consent when the *prompt* is **none**.
   *
   * This prompt is used when the Client wants to perform a silent authentication and/or authorization on the End User.
   *
   * If it cannot perform one of the possible interactions without prompting the End User, it returns an Error Response
   * with the respective error code, otherwise, it will return the updated Session and Consent objects for further
   * processing by the Authorization Endpoint.
   *
   * @param context Authorization Request Context.
   * @param grant Grant with the current authorization step.
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the Scopes granted by the End User.
   * @returns Updated Grant, Session and Consent objects.
   */
  public async handle(
    context: AuthorizationContext<AuthorizationRequest>,
    grant: Grant | null,
    session: Session | null,
    consent: Consent | null
  ): Promise<[Grant | null, Session | null, Consent | null]> {
    const { parameters } = context;

    if (session === null) {
      if (grant?.session == null) {
        throw new LoginRequiredException({ state: parameters.state });
      }

      session = grant.session;
    }

    if (session.expiresAt != null && new Date() > session.expiresAt) {
      await this.sessionService.remove(session);
      throw new LoginRequiredException({ state: parameters.state });
    }

    if (consent === null) {
      if (grant?.consent == null) {
        throw new ConsentRequiredException({ state: parameters.state });
      }

      consent = grant.consent;
    }

    if (consent.expiresAt != null && new Date() > consent.expiresAt) {
      await this.consentService.remove(consent);
      throw new ConsentRequiredException({ state: parameters.state });
    }

    return [grant, session, consent];
  }
}
