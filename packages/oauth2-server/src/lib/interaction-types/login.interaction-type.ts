import { URL } from 'url';

import { Inject, Injectable } from '@guarani/di';

import { LoginContextInteractionContext } from '../context/interaction/login-context.interaction-context';
import { LoginDecisionInteractionContext } from '../context/interaction/login-decision.interaction-context';
import { LoginDecisionAcceptInteractionContext } from '../context/interaction/login-decision-accept.interaction-context';
import { LoginDecisionDenyInteractionContext } from '../context/interaction/login-decision-deny.interaction-context';
import { Grant } from '../entities/grant.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { UnmetAuthenticationRequirementsException } from '../exceptions/unmet-authentication-requirements.exception';
import { AuthHandler } from '../handlers/auth.handler';
import { Logger } from '../logger/logger';
import { LoginContextInteractionResponse } from '../responses/interaction/login-context.interaction-response';
import { LoginDecisionInteractionResponse } from '../responses/interaction/login-decision.interaction-response';
import { GrantServiceInterface } from '../services/grant.service.interface';
import { GRANT_SERVICE } from '../services/grant.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { Prompt } from '../types/prompt.type';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
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
 * It will also delete the analyzed Login.
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
   * @param logger Logger of the Authorization Server.
   * @param authHandler Instance of the Auth Handler.
   * @param settings Settings of the Authorization Server.
   * @param loginService Instance of the Login Service.
   * @param grantService Instance of the Grant Service.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly authHandler: AuthHandler,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(GRANT_SERVICE) private readonly grantService: GrantServiceInterface,
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
   * @returns Login Context Interaction Response.
   */
  public async handleContext(context: LoginContextInteractionContext): Promise<LoginContextInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleContext()`, 'b1776075-3011-4a57-b2ef-5773b5d52777', {
      context,
    });

    const { grant } = context;

    await this.checkGrant(grant);

    const url = addParametersToUrl(new URL('/oauth/authorize', this.settings.issuer), grant.parameters);

    let skip = grant.session.activeLogin !== null;
    let authExp: number | undefined;

    if (grant.session.activeLogin !== null && typeof grant.parameters.max_age !== 'undefined') {
      const authTime = grant.session.activeLogin.createdAt.getTime();
      const maxAge = Number.parseInt(grant.parameters.max_age, 10) * 1000;

      this.logger.debug(`[${this.constructor.name}] Checking Max Age`, '3a0a9a42-b6ae-47d4-b367-0d2d19f77c33', {
        auth_time: authTime,
        max_age: maxAge,
      });

      skip &&= Date.now() < authTime + maxAge;
      authExp = Math.floor((authTime + maxAge) / 1000);

      if (!skip) {
        this.logger.debug(`[${this.constructor.name}] Inactivating old Login`, 'd8a6ef08-9fd1-427a-8ff1-bc574d29b888', {
          login_id: grant.session.activeLogin.id,
        });

        await this.authHandler.inactivateSessionActiveLogin(grant.session);
      }
    }

    const response: LoginContextInteractionResponse = {
      skip,
      request_url: url.href,
      client: grant.client.id,
      context: {
        prompts: <Prompt[]>grant.parameters.prompt?.split(' '),
        display: grant.parameters.display,
        auth_exp: authExp,
        login_hint: grant.parameters.login_hint,
        ui_locales: grant.parameters.ui_locales?.split(' '),
        acr_values: grant.parameters.acr_values?.split(' '),
      },
    };

    this.logger.debug(
      `[${this.constructor.name}] Login Context Interaction completed`,
      '89554ee7-701f-4cc4-b9c4-cb197e03a030',
      { response },
    );

    return response;
  }

  /**
   * Handles the Decision Flow of the Login Interaction.
   *
   * This method decides whether or not to authenticate the end user based on the decision of the application.
   *
   * @param context Login Decision Interaction Request Context.
   * @returns Login Decision Interaction Response.
   */
  public async handleDecision(context: LoginDecisionInteractionContext): Promise<LoginDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handleDecision()`, '3db2fa6e-4a7e-4acb-9cff-32af3fe907c5', {
      context,
    });

    const { decision, grant } = context;

    await this.checkGrant(grant);

    switch (decision) {
      case 'accept': {
        const response = await this.acceptLogin(<LoginDecisionAcceptInteractionContext>context);

        this.logger.debug(
          `[${this.constructor.name}] Login Decision Interaction completed`,
          'a8c4ca8d-001d-444e-a470-4b7d29f90a80',
          { decision, response },
        );

        return response;
      }

      case 'deny': {
        const response = await this.denyLogin(<LoginDecisionDenyInteractionContext>context);

        this.logger.debug(
          `[${this.constructor.name}] Login Decision Interaction completed`,
          '0980f8ca-571f-4d22-a36a-f16823284124',
          { decision, response },
        );

        return response;
      }
    }
  }

  /**
   * Accepts the authentication performed by the application and redirects the User-Agent
   * to continue the Authorization Process.
   *
   * @param context Login Context Interaction Request Context.
   * @returns Login Decision Interaction Response.
   */
  private async acceptLogin(context: LoginDecisionAcceptInteractionContext): Promise<LoginDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called acceptLogin()`, 'e82aee0e-acc8-45d1-9516-97a1836f4bee', {
      context,
    });

    const { acr, amr, grant, user } = context;
    const { client, parameters, session } = grant;

    if (acr !== null && parameters.acr_values?.includes(acr) === false) {
      const error = new UnmetAuthenticationRequirementsException(
        `Could not authenticate using the Authentication Context Class Reference "${parameters.acr_values}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] Could not authenticate using the Authentication Context Class Reference "${parameters.acr_values}"`,
        'f7e07a95-dee0-482b-a244-f3abfc917462',
        { acr, requested_acr: parameters.acr_values },
        error,
      );

      await this.grantService.remove(grant);

      const url = addParametersToUrl(new URL('/oauth/error', this.settings.issuer), error.toJSON());

      return { redirect_to: url.href };
    }

    // TODO: Check ACR values.
    if (session.activeLogin === null) {
      await this.authHandler.login(user, client, session, amr, acr);

      grant.interactions.push('login');
      await this.grantService.save(grant);
    }

    const url = addParametersToUrl(new URL('/oauth/authorize', this.settings.issuer), parameters);

    return { redirect_to: url.href };
  }

  /**
   * Denies the authentication performed by the application and redirects the User-Agent to display the Error details.
   *
   * @param context Login Context Interaction Request Context.
   * @returns Login Decision Interaction Response.
   */
  private async denyLogin(context: LoginDecisionDenyInteractionContext): Promise<LoginDecisionInteractionResponse> {
    this.logger.debug(`[${this.constructor.name}] Called denyLogin()`, 'e394560e-c8ae-45f9-99fc-35f88d55f2ff', {
      context,
    });

    const { error, grant } = context;

    await this.grantService.remove(grant);

    const url = addParametersToUrl(new URL('/oauth/error', this.settings.issuer), error.toJSON());

    return { redirect_to: url.href };
  }

  /**
   * Checks the validity of the Grant.
   *
   * @param grant Grant to be checked.
   */
  private async checkGrant(grant: Grant): Promise<void> {
    this.logger.debug(`[${this.constructor.name}] Called checkGrant()`, 'ab2ea947-74e8-43d6-a2e6-88cbe1809322', {
      grant,
    });

    if (new Date() > grant.expiresAt) {
      await this.grantService.remove(grant);

      const exc = new AccessDeniedException('Expired Grant.');

      this.logger.error(
        `[${this.constructor.name}] Expired Grant`,
        'ed3bbf76-b645-4aa2-b808-44948d72db9f',
        { grant },
        exc,
      );

      throw exc;
    }
  }
}
