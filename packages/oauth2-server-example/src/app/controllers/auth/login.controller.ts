import {
  CodeAuthorizationRequest,
  Display,
  LoginContextInteractionResponse,
  LoginDecisionAcceptInteractionRequest,
  LoginDecisionInteractionResponse,
} from '@guarani/oauth2-server';

import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { URL, URLSearchParams } from 'url';

import { User } from '../../entities/user.entity';

const popupTemplateFn = (redirectUri: string): string => `
<script type="text/javascript">
  window.opener.callback('${redirectUri}');
  window.close();
</script>
`;

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    try {
      const loginChallenge = <string>request.query.login_challenge;

      if (typeof loginChallenge !== 'string') {
        const parameters: CodeAuthorizationRequest = {
          response_type: 'code',
          client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          redirect_uri: 'http://localhost:4000/oauth/callback',
          scope: 'openid profile email phone address',
          state: randomUUID(),
          code_challenge: 'kRaf6IMJlerQjcqlFczEUYUcVsdwMpYonctl1yXYiiI',
          code_challenge_method: 'S256',
        };

        const url = new URL('http://localhost:4000/oauth/authorize');
        const searchParameters = new URLSearchParams(parameters);

        url.search = searchParameters.toString();

        return response.redirect(303, url.href);
      }

      const url = new URL('http://localhost:4000/oauth/interaction');
      const searchParams = new URLSearchParams({ interaction_type: 'login', login_challenge: loginChallenge });

      url.search = searchParams.toString();

      const { data } = await axios.get<LoginContextInteractionResponse>(url.href);

      const { display, auth_exp: authExp, prompts, login_hint: loginHint } = data.context;

      if (display === 'popup') {
        response.cookie('display', 'popup');
      }

      if (data.skip) {
        return this.redirectOrClosePopup(response, data.request_url, display);
      }

      if (
        request.isAuthenticated() &&
        prompts?.includes('login') !== true && // no prompt login
        (authExp === undefined || new Date() <= new Date(authExp * 1000)) // no max_age or not expired yet.
      ) {
        return await this.doLogin(request, response, loginChallenge, <User>request.user, display);
      }

      return response.render('auth/login', {
        request,
        title: 'Login',
        display,
        login_challenge: loginChallenge,
        login_hint: loginHint,
        error: request.flash('error'),
        success: request.flash('success'),
      });
    } catch (exc: any) {
      if (exc instanceof AxiosError) {
        response.json(exc.response?.data);
        return;
      }

      throw exc;
    }
  }

  public async post(request: Request, response: Response): Promise<void> {
    const { login_challenge: loginChallenge } = request.body;

    if (typeof loginChallenge !== 'string') {
      return response.redirect(303, '/');
    }

    return await this.doLogin(request, response, loginChallenge, <User>request.user);
  }

  private async doLogin(
    request: Request,
    response: Response,
    loginChallenge: string,
    user: User,
    display?: Display
  ): Promise<void> {
    const reqParameters: LoginDecisionAcceptInteractionRequest = {
      interaction_type: 'login',
      login_challenge: loginChallenge,
      decision: 'accept',
      subject: Reflect.get(user!, 'id'),
      amr: 'pwd',
      acr: 'urn:guarani:acr:1fa',
    };

    const reqBody = new URLSearchParams(reqParameters);

    try {
      const {
        data: { redirect_to: redirectTo },
      } = await axios.post<LoginDecisionInteractionResponse>(
        'http://localhost:4000/oauth/interaction',
        reqBody.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      display ??= <Display>request.cookies.display;

      return this.redirectOrClosePopup(response, redirectTo, display);
    } catch (exc: unknown) {
      if (exc instanceof AxiosError) {
        response.json(exc.response?.data);
        return;
      }

      throw exc;
    }
  }

  private redirectOrClosePopup(response: Response, url: string, display: Display | undefined): void {
    if (display === 'popup') {
      response.clearCookie('display').send(popupTemplateFn(url));
      return;
    }

    return response.redirect(303, url);
  }
}

export const LoginController = new Controller();
