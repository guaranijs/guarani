import { Inject, Injectable } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { URL, URLSearchParams } from 'url';

import { Grant } from '../entities/grant.entity';
import { User } from '../entities/user.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { Prompt } from '../prompts/prompt.type';
import { LoginContextInteractionRequest } from '../requests/interaction/login-context.interaction-request';
import { LoginDecisionAcceptInteractionRequest } from '../requests/interaction/login-decision-accept.interaction-request';
import { LoginDecisionDenyInteractionRequest } from '../requests/interaction/login-decision-deny.interaction-request';
import { LoginDecisionInteractionRequest } from '../requests/interaction/login-decision.interaction-request';
import { LoginContextInteractionResponse } from '../responses/interaction/login-context.interaction-response';
import { LoginDecisionInteractionResponse } from '../responses/interaction/login-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { InteractionTypeInterface } from './interaction-type.interface';
import { InteractionType } from './interaction-type.type';

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
   * @param userService Instance of the User Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface
  ) {}

  /**
   * Handles the Context Flow of the Login Interaction.
   *
   * This method verifies if there is an authenticated user registered at the authorization server.
   *
   * If no user is found, it informs the application to display the login screen and provides the necessary data,
   * otherwise, it informs the application that it can safely skip this process and proceed with the authorization.
   *
   * @param parameters Parameters of the Login Context Interaction Request.
   * @returns Parameters of the Login Context Interaction Response.
   */
  public async handleContext(parameters: LoginContextInteractionRequest): Promise<LoginContextInteractionResponse> {
    this.checkContextParameters(parameters);

    const grant = await this.getGrantByLoginChallenge(parameters.login_challenge);

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
      client: grant.client,
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
   * Checks if the Parameters of the Login Context Interaction Request are valid.
   *
   * @param parameters Parameters of the Login Context Interaction Request.
   */
  private checkContextParameters(parameters: LoginContextInteractionRequest): void {
    const { login_challenge: loginChallenge } = parameters;

    if (typeof loginChallenge !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "login_challenge".' });
    }
  }

  /**
   * Handles the Decision Flow of the Login Interaction.
   *
   * This method decides whether or not to authenticate the end user based on the decision of the application.
   *
   * @param parameters Parameters of the Login Decision Interaction Request.
   * @returns Parameters of the Login Decision Interaction Response.
   */
  public async handleDecision(parameters: LoginDecisionInteractionRequest): Promise<LoginDecisionInteractionResponse> {
    this.checkDecisionParameters(parameters);

    const grant = await this.getGrantByLoginChallenge(parameters.login_challenge);

    await this.checkGrant(grant);

    switch (parameters.decision) {
      case 'accept':
        return await this.acceptLogin(<LoginDecisionAcceptInteractionRequest>parameters, grant);

      case 'deny':
        return await this.denyLogin(<LoginDecisionDenyInteractionRequest>parameters, grant);

      default:
        throw new InvalidRequestException({ description: `Unsupported decision "${parameters.decision}".` });
    }
  }

  /**
   * Checks if the Parameters of the Login Decision Interaction Request are valid.
   *
   * @param parameters Parameters of the Login Decision Interaction Request.
   */
  private checkDecisionParameters(parameters: LoginDecisionInteractionRequest): void {
    const { login_challenge: loginChallenge, decision } = parameters;

    if (typeof loginChallenge !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "login_challenge".' });
    }

    if (typeof decision !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "decision".' });
    }
  }

  /**
   * Accepts the authentication performed by the application and redirects the User-Agent
   * to continue the Authorization Process.
   *
   * @param parameters Parameters of the Login Accept Decision Interaction Request.
   * @param grant Grant of the Login Interaction.
   * @returns Redirect Url for the User-Agent to continue the Authorization Process.
   */
  private async acceptLogin(
    parameters: LoginDecisionAcceptInteractionRequest,
    grant: Grant
  ): Promise<LoginDecisionInteractionResponse> {
    this.checkAcceptDecisionParameters(parameters);

    if (grant.session == null) {
      const { amr, acr } = parameters;

      const user = await this.getUser(parameters.subject);
      const session = await this.sessionService.create(user, amr?.split(' '), acr);

      grant.session = session;

      await this.grantService.save(grant);
    }

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(grant.parameters);

    url.search = searchParameters.toString();

    return { redirect_to: url.href };
  }

  /**
   * Checks if the Parameters of the Login Accept Decision Interaction Request are valid.
   *
   * @param parameters Parameters of the Login Accept Decision Interaction Request.
   */
  private checkAcceptDecisionParameters(parameters: LoginDecisionAcceptInteractionRequest): void {
    const { subject, amr, acr } = parameters;

    if (typeof subject !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "subject".' });
    }

    if (amr !== undefined && typeof amr !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "amr".' });
    }

    if (acr !== undefined && typeof acr !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "acr".' });
    }
  }

  /**
   * Denies the authentication performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param parameters Parameters of the Login Deny Decision Interaction Request.
   * @param grant Grant of the Login Interaction.
   * @returns Redirect Url for the User-Agent to abort the Authorization Process.
   */
  private async denyLogin(
    parameters: LoginDecisionDenyInteractionRequest,
    grant: Grant
  ): Promise<LoginDecisionInteractionResponse> {
    this.checkDenyDecisionParameters(parameters);

    await this.grantService.remove(grant);

    const { error, error_description: errorDescription } = parameters;

    const url = new URL('/oauth/error', this.settings.issuer);
    const searchParameters = new URLSearchParams({ error, error_description: errorDescription });

    url.search = searchParameters.toString();

    return { redirect_to: url.href };
  }

  /**
   * Checks if the Parameters of the Login Deny Decision Interaction Request are valid.
   *
   * @param parameters Parameters of the Login Deny Decision Interaction Request.
   */
  private checkDenyDecisionParameters(parameters: LoginDecisionDenyInteractionRequest): void {
    const { error, error_description: errorDescription } = parameters;

    if (typeof error !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "error".' });
    }

    if (typeof errorDescription !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "error_description".' });
    }
  }

  /**
   * Fetches the requested Grant from the application's storage.
   *
   * @param loginChallenge Login Challenge provided by the Client.
   * @returns Grant based on the provided Login Challenge.
   */
  private async getGrantByLoginChallenge(loginChallenge: string): Promise<Grant> {
    const grant = await this.grantService.findOneByLoginChallenge(loginChallenge);

    if (grant === null) {
      throw new AccessDeniedException({ description: 'Invalid Login Challenge.' });
    }

    return grant;
  }

  /**
   * Checks the validity of the Grant.
   *
   * @param grant Grant to be checked.
   */
  private async checkGrant(grant: Grant): Promise<void> {
    try {
      if (new Date() > grant.expiresAt) {
        throw new AccessDeniedException({ description: 'Expired Grant.' });
      }
    } catch (exc: unknown) {
      await this.grantService.remove(grant);
      throw exc;
    }
  }

  /**
   * Fetches a User from the application's storage based on the provided Subject Identifier.
   *
   * @param subject Identifier of the User.
   * @returns User based on the provided Client Identifier.
   */
  private async getUser(subject: string): Promise<User> {
    const user = await this.userService.findOne(subject);

    if (user === null) {
      throw new AccessDeniedException({ description: 'Invalid User.' });
    }

    return user;
  }
}
