import { LoginContextInteractionResponse, LoginDecisionInteractionResponse } from '@guarani/oauth2-server';

import axios, { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { URL, URLSearchParams } from 'url';

import { User } from '../../entities/user.entity';

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    try {
      const loginChallenge = <string>request.query.login_challenge;

      if (typeof loginChallenge !== 'string') {
        return request.isAuthenticated()
          ? response.redirect(303, '/')
          : response.render('auth/login', {
              request,
              title: 'Login',
              error: request.flash('error'),
              success: request.flash('success'),
            });
      }

      const url = new URL('http://localhost:4000/oauth/interaction');
      const searchParams = new URLSearchParams({ interaction_type: 'login', login_challenge: loginChallenge });

      url.search = searchParams.toString();

      const { data } = await axios.get<LoginContextInteractionResponse>(url.href);

      if (data.skip) {
        return response.redirect(303, data.request_url);
      }

      if (request.isAuthenticated() && !data.context.prompts.includes('login')) {
        const redirectTo = await this.doLogin(loginChallenge, <User>request.user);
        return response.redirect(303, redirectTo);
      }

      return response.render('auth/login', {
        request,
        title: 'Login',
        login_challenge: loginChallenge,
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

    const redirectTo = await this.doLogin(loginChallenge, <User>request.user);

    return response.redirect(303, redirectTo);
  }

  private async doLogin(loginChallenge: string, user: User): Promise<string> {
    const reqBody = new URLSearchParams({
      interaction_type: 'login',
      login_challenge: loginChallenge,
      decision: 'accept',
      subject: Reflect.get(user!, 'id'),
    });

    const {
      data: { redirect_to: redirectTo },
    } = await axios.post<LoginDecisionInteractionResponse>(
      'http://localhost:4000/oauth/interaction',
      reqBody.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return redirectTo;
  }
}

export const LoginController = new Controller();
