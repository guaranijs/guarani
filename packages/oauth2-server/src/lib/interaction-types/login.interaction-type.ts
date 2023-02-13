import { Inject, Injectable } from '@guarani/di';

import { URL, URLSearchParams } from 'url';

import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { LoginContextInteractionRequest } from '../messages/login-context.interaction-request';
import { LoginContextInteractionResponse } from '../messages/login-context.interaction-response';
import { LoginDecisionAcceptInteractionRequest } from '../messages/login-decision-accept.interaction-request';
import { LoginDecisionDenyInteractionRequest } from '../messages/login-decision-deny.interaction-request';
import { LoginDecisionInteractionRequest } from '../messages/login-decision.interaction-request';
import { LoginDecisionInteractionResponse } from '../messages/login-decision.interaction-response';
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
   * @param userService Instance of the User Service.
   */
  public constructor(
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(SESSION_SERVICE) private readonly sessionService: SessionServiceInterface,
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

    const session = await this.getSession(parameters.login_challenge);

    await this.checkSession(session);

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(session.parameters);

    url.search = searchParameters.toString();

    return {
      skip: session.user !== null,
      request_url: url.href,
      client: session.client,
      context: {},
    };
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

    const session = await this.getSession(parameters.login_challenge);

    await this.checkSession(session);

    switch (parameters.decision) {
      case 'accept':
        return await this.acceptLogin(<LoginDecisionAcceptInteractionRequest>parameters, session);

      case 'deny':
        return await this.denyLogin(<LoginDecisionDenyInteractionRequest>parameters, session);

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
   * @param session Session of the Login Interaction.
   * @returns Redirect Url for the User-Agent to continue the Authorization Process.
   */
  private async acceptLogin(
    parameters: LoginDecisionAcceptInteractionRequest,
    session: Session
  ): Promise<LoginDecisionInteractionResponse> {
    this.checkAcceptDecisionParameters(parameters);

    const user = await this.getUser(parameters.subject);

    session.user = user;

    await this.sessionService.save(session);

    const url = new URL('/oauth/authorize', this.settings.issuer);
    const searchParameters = new URLSearchParams(session.parameters);

    url.search = searchParameters.toString();

    return { redirect_to: url.href };
  }

  /**
   * Checks if the Parameters of the Login Accept Decision Interaction Request are valid.
   *
   * @param parameters Parameters of the Login Accept Decision Interaction Request.
   */
  private checkAcceptDecisionParameters(parameters: LoginDecisionAcceptInteractionRequest): void {
    const { subject } = parameters;

    if (typeof subject !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "subject".' });
    }
  }

  /**
   * Denies the authentication performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param parameters Parameters of the Login Deny Decision Interaction Request.
   * @param session Session of the Login Interaction.
   * @returns Redirect Url for the User-Agent to abort the Authorization Process.
   */
  private async denyLogin(
    parameters: LoginDecisionDenyInteractionRequest,
    session: Session
  ): Promise<LoginDecisionInteractionResponse> {
    this.checkDenyDecisionParameters(parameters);

    await this.sessionService.remove(session);

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
   * Fetches the requested Session from the application's storage.
   *
   * @param id Identifier provided by the Client.
   * @returns Session based on the provided Identifier.
   */
  private async getSession(id: string): Promise<Session> {
    const session = await this.sessionService.findOne(id);

    if (session === null) {
      throw new AccessDeniedException({ description: 'Invalid Session.' });
    }

    return session;
  }

  /**
   * Checks the validity of the Session.
   *
   * @param session Session to be checked.
   */
  private async checkSession(session: Session): Promise<void> {
    try {
      if (session.expiresAt != null && new Date() > session.expiresAt) {
        throw new AccessDeniedException({ description: 'Expired Session.' });
      }
    } catch (exc: unknown) {
      await this.sessionService.remove(session);
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
