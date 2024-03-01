import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';

import { SelectAccountContextInteractionContext } from '../context/interaction/select-account-context.interaction-context';
import { SelectAccountDecisionInteractionContext } from '../context/interaction/select-account-decision.interaction-context';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { Logger } from '../logger/logger';
import { SelectAccountContextInteractionResponse } from '../responses/interaction/select-account-context.interaction-response';
import { SelectAccountDecisionInteractionResponse } from '../responses/interaction/select-account-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Prompt } from '../types/prompt.type';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

/**
 * Implementation of the **Select Account** Interaction Type.
 *
 * This Interaction is used by the application to inform the authorization server of the login
 * to be used in the authentication / authorization process.
 *
 * The Context portion of the Interaction returns the list of logins currently registered at the User-Agent.
 *
 * The Decision portion of the Interaction will receive the identifier of the login selected by the end-user
 * to be used in the authentication / authorization process.
 */
@Injectable()
export class SelectAccountInteractionType implements InteractionTypeInterface {
  /**
   * Name of the Interaction Type.
   */
  public readonly name: InteractionType = 'select_account';

  /**
   * Instantiates a new Select Account Interaction Type.
   *
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param sessionService Instance of the Session Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
  ) {}

  /**
   * Handles the Context Flow of the Select Account Interaction.
   *
   * @param context Select Account Context Interaction Request Context.
   * @returns Select Account Context Interaction Response.
   */
  public async handleContext(
    context: SelectAccountContextInteractionContext,
  ): Promise<SelectAccountContextInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleContext()`, '678536a1-0c90-4d21-8cc5-6f72973c0ae3', {
      context,
    });

    const { grant, session } = context;

    await this.checkGrant(grant);

    const response: SelectAccountContextInteractionResponse = {
      logins: session.logins.map((login) => login.id),
      context: {
        display: grant.parameters.display,
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        ui_locales: grant.parameters.ui_locales?.split(' '),
      },
    };

    this.logger.debug(
      `[${this.constructor.name}] Select Account Context Interaction completed`,
      'cb170641-7ff1-445f-886e-9f99cb28233a',
      { response },
    );

    return response;
  }

  /**
   * Handles the Decision Flow of the Select Account Interaction.
   *
   * @param context Select Account Decision Interaction Request Context.
   * @returns Select Account Decision Interaction Response.
   */
  public async handleDecision(
    context: SelectAccountDecisionInteractionContext,
  ): Promise<SelectAccountDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleDecision()`, '90988436-188f-4489-91ee-729d94b19ba6', {
      context,
    });

    const { grant, login } = context;

    await this.checkGrant(grant);

    if (!grant.interactions.includes('select_account')) {
      grant.session.activeLogin = login;
      await this.sessionService.save(grant.session);

      grant.interactions.push('select_account');
      await this.grantService.save(grant);
    }

    const url = addParametersToUrl(new URL('/oauth/authorize', this.settings.issuer), grant.parameters);

    return { redirect_to: url.href };
  }

  /**
   * Checks the validity of the Grant.
   *
   * @param grant Grant to be checked.
   */
  private async checkGrant(grant: Grant): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called checkGrant()`, '0e994f0f-3595-4ebf-90ed-3e97cd33d9fb', {
      grant,
    });

    if (new Date() > grant.expiresAt) {
      await this.grantService.remove(grant);

      const exc = new AccessDeniedException('Expired Grant.');

      this.logger.error(
        `[${this.constructor.name}] Expired Grant`,
        '9e2854de-27fc-4136-bd6c-c64bdba3d72a',
        { grant },
        exc,
      );

      throw exc;
    }
  }
}
