import { Inject, Injectable } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { URL, URLSearchParams } from 'url';

import { CreateContextInteractionContext } from '../context/interaction/create-context.interaction-context';
import { CreateDecisionInteractionContext } from '../context/interaction/create-decision.interaction-context';
import { Grant } from '../entities/grant.entity';
import { Login } from '../entities/login.entity';
import { Session } from '../entities/session.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { CreateContextInteractionResponse } from '../responses/interaction/create-context.interaction-response';
import { CreateDecisionInteractionResponse } from '../responses/interaction/create-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { LoginServiceInterface } from '../services/login.service.interface';
import { LOGIN_SERVICE } from '../services/login.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Prompt } from '../types/prompt.type';
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
   * @param settings Settings of the Authorization Server.
   * @param grantService Instance of the Grant Service.
   * @param userService Instance of the User Service.
   * @param loginService Instance of the Login Service.
   * @param sessionService Instance of the Session Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
    @Inject(LOGIN_SERVICE) private readonly loginService: LoginServiceInterface,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface
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

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(grant.parameters as Dictionary<any>);

    url.search = searchParameters.toString();

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

      const login = await this.loginService.create(user, grant.session, null, null);
      await this.updateActiveLogin(grant.session, login);

      grant.interactions.push('create');
      await this.grantService.save(grant);
    }

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(grant.parameters as Dictionary<any>);

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
      throw new AccessDeniedException('Expired Grant.');
    }
  }

  /**
   * Updates the Active Login of the Session and adds the Login to the list of Logins of the Session.
   *
   * @param session Session of the Request.
   * @param login Login to be added to the Session.
   */
  private async updateActiveLogin(session: Session, login: Login): Promise<void> {
    session.activeLogin = login;
    session.logins.push(login);

    await this.sessionService.save(session);
  }
}
