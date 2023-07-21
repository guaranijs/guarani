import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';

import { CreateContextInteractionContext } from '../context/interaction/create-context.interaction-context';
import { CreateDecisionInteractionContext } from '../context/interaction/create-decision.interaction-context';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AuthHandler } from '../handlers/auth.handler';
import { CreateContextInteractionResponse } from '../responses/interaction/create-context.interaction-response';
import { CreateDecisionInteractionResponse } from '../responses/interaction/create-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Prompt } from '../types/prompt.type';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

/**
 * Implementation of the **Create** Interaction Type.
 *
 * This Interaction is used by the application to inform the authorization server that the User
 * will create a new account in order to proceed with the Authorization Process.
 *
 * The Context portion of the Interaction informs if an account has been created.
 *
 * The Decision portion of the Interaction will receive the identifier of the registered User
 * to proceed with the authorization process.
 */
@Injectable()
export class CreateInteractionType implements InteractionTypeInterface {
  /**
   * Name of the Interaction Type.
   */
  public readonly name: InteractionType = 'create';

  /**
   * Instantiates a new Create Interaction Type.
   *
   * @param authHandler Instance of the Auth Handler.
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly authHandler: AuthHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface
  ) {}

  /**
   * Handles the Context Flow of the Create Interaction.
   *
   * @param context Create Context Interaction Request Context.
   * @returns Create Context Interaction Response.
   */
  public async handleContext(context: CreateContextInteractionContext): Promise<CreateContextInteractionResponse> {
    const { grant } = context;

    await this.checkGrant(grant);

    const url = addParametersToUrl(new URL('/oauth/authorize', this.settings.issuer), grant.parameters);

    return {
      skip: grant.interactions.includes('create'),
      request_url: url.href,
      context: {
        display: grant.parameters.display,
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        ui_locales: grant.parameters.ui_locales?.split(' '),
      },
    };
  }

  /**
   * Handles the Decision Flow of the Create Interaction.
   *
   * @param context Create Decision Interaction Request Context.
   * @returns Create Decision Interaction Response.
   */
  public async handleDecision(context: CreateDecisionInteractionContext): Promise<CreateDecisionInteractionResponse> {
    const { grant, parameters } = context;

    await this.checkGrant(grant);

    if (!grant.interactions.includes('create')) {
      const user = await this.userService.create(parameters);
      await this.authHandler.login(user, grant.session, null, null);

      grant.interactions.push('create');
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
    if (new Date() > grant.expiresAt) {
      await this.grantService.remove(grant);
      throw new AccessDeniedException('Expired Grant.');
    }
  }
}
