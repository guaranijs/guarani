import { Inject, Injectable } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { URL, URLSearchParams } from 'url';

import { LoginContextInteractionContext } from '../context/interaction/login-context.interaction.context';
import { LoginDecisionAcceptInteractionContext } from '../context/interaction/login-decision-accept.interaction.context';
import { LoginDecisionDenyInteractionContext } from '../context/interaction/login-decision-deny.interaction.context';
import { LoginDecisionInteractionContext } from '../context/interaction/login-decision.interaction.context';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { Prompt } from '../prompts/prompt.type';
import { LoginContextInteractionResponse } from '../responses/interaction/login-context.interaction-response';
import { LoginDecisionInteractionResponse } from '../responses/interaction/login-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';
import { LoginDecision } from './login-decision.type';

/**
 * Implementation of the **Login** Interaction Type.
 *
 * This Interaction is used by the application to inform the authorization server of the authentication
 * of the end user of the current authorization process.
 *
 * The Context portion of the Interaction checks if there is already an authenticated end user
 * based on the provided **login_challenge**. It then informs the application whether or not to force
 * the authentication of an end user.
 *
 * The Decision portion of the Interaction will deliberate on the decision to either **accept** or **deny**
 * the authentication of an end user based on the parameters provided by the application.
 *
 * If the authentication is denied, the authorization server informs the User-Agent to redirect
 * to the authorization server's error page to display the reason of the failure.
 * It will also delete the analyzed Session.
 *
 * If the authentication is accepted, the authorization server informs the User-Agent to redirect
 * to the authorization endpoint to continue the authorization process.
 */
@Injectable()
export class LoginInteractionType implements InteractionTypeInterface {
  /**
   * Name of the Interaction Type.
   */
  public readonly name: InteractionType = 'login';

  /**
   * Instantiates a new Login Interaction Type.
   *
   * @param settings Settings of the Authorization Server.
   * @param sessionService Instance of the Session Service.
   * @param grantService Instance of the Grant Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface
  ) {}

  /**
   * Handles the Context Flow of the Login Interaction.
   *
   * This method verifies if there is an authenticated user registered at the authorization server.
   *
   * If no user is found, it informs the application to display the login screen and provides the necessary data,
   * otherwise, it informs the application that it can safely skip this process and proceed with the authorization.
   *
   * @param context Login Context Interaction Request Context.
   * @returns Parameters of the Login Context Interaction Response.
   */
  public async handleContext(context: LoginContextInteractionContext): Promise<LoginContextInteractionResponse> {
    const { grant } = context;

    await this.checkGrant(grant);

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(grant.parameters);

    url.search = searchParameters.toString();

    let skip = grant.session != null;
    let authExp: number | undefined;

    if (grant.session != null && grant.parameters.max_age !== undefined) {
      const authTime = grant.session.createdAt.getTime();
      const maxAge = Number.parseInt(grant.parameters.max_age, 10) * 1000;

      skip &&= Date.now() < authTime + maxAge;
      authExp = Math.floor((authTime + maxAge) / 1000);

      if (!skip) {
        await this.sessionService.remove(grant.session);
      }
    }

    return removeUndefined<LoginContextInteractionResponse>({
      skip,
      request_url: url.href,
      client: grant.client, // TODO: return only the client id.
      context: {
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        display: grant.parameters.display,
        auth_exp: authExp,
        login_hint: grant.parameters.login_hint,
        ui_locales: grant.parameters.ui_locales?.split(' '),
        acr_values: grant.parameters.acr_values?.split(' '),
      },
    });
  }

  /**
   * Handles the Decision Flow of the Login Interaction.
   *
   * This method decides whether or not to authenticate the end user based on the decision of the application.
   *
   * @param context Login Context Interaction Request Context.
   * @returns Parameters of the Login Decision Interaction Response.
   */
  public async handleDecision(
    context: LoginDecisionInteractionContext<LoginDecision>
  ): Promise<LoginDecisionInteractionResponse> {
    const { grant } = context;

    await this.checkGrant(grant);

    switch (context.decision) {
      case 'accept':
        return await this.acceptLogin(<LoginDecisionAcceptInteractionContext>context);

      case 'deny':
        return await this.denyLogin(<LoginDecisionDenyInteractionContext>context);
    }
  }

  /**
   * Accepts the authentication performed by the application and redirects the User-Agent
   * to continue the Authorization Process.
   *
   * @param context Login Context Interaction Request Context.
   * @returns Redirect Url for the User-Agent to continue the Authorization Process.
   */
  private async acceptLogin(context: LoginDecisionAcceptInteractionContext): Promise<LoginDecisionInteractionResponse> {
    const { acr, amr, grant, user } = context;

    if (grant.session == null) {
      grant.session = await this.sessionService.create(user, amr, acr);

      await this.grantService.save(grant);
    }

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(grant.parameters);

    url.search = searchParameters.toString();

    return { redirect_to: url.href };
  }

  /**
   * Denies the authentication performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param context Login Context Interaction Request Context.
   * @returns Redirect Url for the User-Agent to abort the Authorization Process.
   */
  private async denyLogin(context: LoginDecisionDenyInteractionContext): Promise<LoginDecisionInteractionResponse> {
    const { error, grant } = context;

    await this.grantService.remove(grant);

    const url = new URL('/oauth/error', this.settings.issuer);
    const searchParameters = new URLSearchParams(error.toJSON());

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
