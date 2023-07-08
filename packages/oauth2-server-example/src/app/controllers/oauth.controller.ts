import axios, { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import { TokenResponse } from '@guarani/oauth2-server';
import { Dictionary } from '@guarani/types';

class Controller {
  public async callback(request: Request, response: Response): Promise<void> {
    const parameters = request.query;

    if (typeof parameters.error !== 'undefined') {
      return this.redirectToErrorPage(response, parameters);
    }

    const body = stringifyQs({
      grant_type: 'authorization_code',
      code: parameters.code as string,
      redirect_uri: 'http://localhost:4000/oauth/callback',
      code_verifier: 'tQZ78ORvyh21XgJFNyM4xVrpyFDutQMGWz03fVWO-1c',
    });

    try {
      const { data } = await axios.post<TokenResponse>('/oauth/token', body, {
        auth: {
          username: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          password: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
        },
        baseURL: 'http://localhost:4000',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (typeof data.id_token !== 'undefined') {
        response.cookie('id_token', data.id_token, { signed: true });
      }

      return response.redirect(303, '/profile');
    } catch (exc: unknown) {
      if (exc instanceof AxiosError) {
        return this.redirectToErrorPage(response, exc.response?.data ?? {});
      }

      throw exc;
    }
  }

  public async logoutCallback(request: Request, response: Response): Promise<void> {
    return response.render('oauth/logout-callback', { request, title: 'Logout' });
  }

  public async error(request: Request, response: Response): Promise<void> {
    const parameters = request.query;

    if (parameters.error === 'login_required') {
      request.logout(() => null);
    }

    return response.render('oauth/error', { request, title: 'OAuth 2.0 Error', parameters });
  }

  private redirectToErrorPage(response: Response, parameters: Dictionary<any>): void {
    const url = new URL('http://localhost:4000/oauth/error');
    url.search = stringifyQs(parameters);

    return response.redirect(303, url.href);
  }
}

export const OAuthController = new Controller();
