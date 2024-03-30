import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';

import { CreateContextInteractionContext } from '../context/interaction/create-context.interaction-context';
import { CreateDecisionInteractionContext } from '../context/interaction/create-decision.interaction-context';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { AuthHandler } from '../handlers/auth.handler';
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param authHandler Instance of the Auth Handler.
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly authHandler: AuthHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
  ) {}

  /**
   * Handles the Context Flow of the Create Interaction.
   *
   * @param context Create Context Interaction Request Context.
   * @returns Create Context Interaction Response.
   */
  public async handleContext(context: CreateContextInteractionContext): Promise<CreateContextInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleContext()`, '8292fe43-6bb7-4cb1-9a1e-90972cd55576', {
      context,
    });

    const { grant } = context;

    await this.checkGrant(grant);

    const url = addParametersToUrl(new URL('/oauth/authorize', this.settings.issuer), grant.parameters);

    const response: CreateContextInteractionResponse = {
      skip: grant.interactions.includes('create'),
      request_url: url.href,
      context: {
        display: grant.parameters.display,
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        ui_locales: grant.parameters.ui_locales?.split(' '),
      },
    };

    this.logger.debug(
      `[${this.constructor.name}] Create Context Interaction completed`,
      '4ea5d916-02cc-45b1-bfd4-7558665f44f9',
      { response },
    );

    return response;
  }

  /**
   * Handles the Decision Flow of the Create Interaction.
   *
   * @param context Create Decision Interaction Request Context.
   * @returns Create Decision Interaction Response.
   */
  public async handleDecision(context: CreateDecisionInteractionContext): Promise<CreateDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleDecision()`, '42e021e3-4c3f-4bd2-8535-ec15666d73a9', {
      context,
    });

    const { grant, parameters } = context;
    const { client, session } = grant;

    await this.checkGrant(grant);

    if (!grant.interactions.includes('create')) {
      const user = await this.userService.create(parameters);
      await this.authHandler.login(user, client, session, null, null);

      grant.interactions.push('create');
      await this.grantService.save(grant);
    }

    const url = addParametersToUrl(new URL('/oauth/authorize', this.settings.issuer), grant.parameters);

    const response: CreateDecisionInteractionResponse = { redirect_to: url.href };

    this.logger.debug(
      `[${this.constructor.name}] Create Decision Interaction completed`,
      'dabe16a8-0a63-410c-9269-0e6511f4a7db',
      { response },
    );

    return response;
  }

  /**
   * Checks the validity of the Grant.
   *
   * @param grant Grant to be checked.
   */
  private async checkGrant(grant: Grant): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called checkGrant()`, '7acad2cb-6feb-4e75-9b03-33962d02b095', {
      grant,
    });

    if (new Date() > grant.expiresAt) {
      await this.grantService.remove(grant);

      const exc = new AccessDeniedException('Expired Grant.');

      this.logger.error(
        `[${this.constructor.name}] Expired Grant`,
        '0f2c6985-07d7-416e-b8dc-5ea7f2c9f586',
        { grant },
        exc,
      );

      throw exc;
    }
  }
}
