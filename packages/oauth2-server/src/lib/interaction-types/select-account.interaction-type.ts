import { Inject, Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { URL } from 'url';

import { SelectAccountContextInteractionContext } from '../context/interaction/select-account-context.interaction.context';
import { SelectAccountDecisionInteractionContext } from '../context/interaction/select-account-decision.interaction.context';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { SelectAccountContextInteractionResponse } from '../responses/interaction/select-account-context.interaction-response';
import { SelectAccountDecisionInteractionResponse } from '../responses/interaction/select-account-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Prompt } from '../types/prompt.type';
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
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param sessionService Instance of the Session Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface
  ) {}

  /**
   * Handles the Context Flow of the Select Account Interaction.
   *
   * @param context Select Account Context Interaction Request Context.
   * @returns Select Account Context Interaction Response.
   */
  public async handleContext(
    context: SelectAccountContextInteractionContext
  ): Promise<SelectAccountContextInteractionResponse> {
    const { grant, session } = context;

    await this.checkGrant(grant);

    return removeNullishValues<SelectAccountContextInteractionResponse>({
      logins: session.logins.map((login) => login.id),
      context: {
        display: grant.parameters.display,
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        ui_locales: grant.parameters.ui_locales?.split(' '),
      },
    });
  }

  /**
   * Handles the Decision Flow of the Select Account Interaction.
   *
   * @param context Select Account Decision Interaction Request Context.
   * @returns Select Account Decision Interaction Response.
   */
  public async handleDecision(
    context: SelectAccountDecisionInteractionContext
  ): Promise<SelectAccountDecisionInteractionResponse> {
    const { grant, login } = context;

    await this.checkGrant(grant);

    if (!grant.interactions.includes('select_account')) {
      grant.session.activeLogin = login;
      grant.interactions.push('select_account');

      await this.sessionService.save(grant.session);
      await this.grantService.save(grant);
    }

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(grant.parameters);

    url.search = searchParameters.toString();

    return { redirect_to: url.href };
  }

  /**
   * Checks the validity of the Grant.
   *
   * @param grant Grant to be checked.
   */
  private async checkGrant(grant: Grant): Promise<void> {
    if (new Date() > grant.expiresAt) {
      await this.grantService.remove(grant);
      throw new AccessDeniedException({ description: 'Expired Grant.' });
    }
  }
}
