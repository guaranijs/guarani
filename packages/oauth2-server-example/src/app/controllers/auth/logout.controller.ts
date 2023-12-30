import axios, { AxiosError } from 'axios';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import {
  EndSessionRequest,
  LogoutContextInteractionResponse,
  LogoutDecision,
  LogoutDecisionInteractionRequest,
  LogoutDecisionInteractionResponse,
} from '@guarani/oauth2-server';

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    try {
      const logoutChallenge = request.query.logout_challenge as string;

      if (typeof logoutChallenge !== 'string') {
        const idToken: string = request.signedCookies.id_token;

        const parameters: EndSessionRequest = {
          id_token_hint: idToken,
          client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          post_logout_redirect_uri: 'http://localhost:4000/auth/logout_callback',
          state: randomUUID(),
        };

        const url = new URL('http://localhost:4000/oauth/end_session');
        url.search = stringifyQs(parameters);

        return response.redirect(303, url.href);
      }

      const url = new URL('http://localhost:4000/oauth/interaction');
      url.search = stringifyQs({ interaction_type: 'logout', logout_challenge: logoutChallenge });

      const { data } = await axios.get<LogoutContextInteractionResponse>(url.href);

      if (data.skip) {
        return response.redirect(303, '/');
      }

      return response.render('auth/logout', {
        request,
        title: 'Logout',
        logout_challenge: logoutChallenge,
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
    const { logout_challenge: logoutChallenge, decision } = request.body;

    if (typeof logoutChallenge !== 'string') {
      return response.redirect(303, '/');
    }

    const reqData: LogoutDecisionInteractionRequest = {
      interaction_type: 'logout',
      logout_challenge: logoutChallenge,
      decision: decision as LogoutDecision,
    };

    switch (decision) {
      case 'accept': {
        const sessionId: string = request.signedCookies['guarani:session'];
        reqData.session_id = sessionId;
        reqData.logout_type = 'local';
        break;
      }

      case 'deny':
        reqData.error = 'logout_denied';
        reqData.error_description = 'The user denied the logout.';
        break;

      default:
        throw new Error('Invalid parameter "decision".');
    }

    const reqBody = stringifyQs(reqData);

    try {
      const {
        data: { redirect_to: redirectTo },
      } = await axios.post<LogoutDecisionInteractionResponse>('http://localhost:4000/oauth/interaction', reqBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      switch (decision) {
        case 'accept':
          response.clearCookie('id_token', { signed: true });
          request.logout(() => null);
          break;

        case 'deny':
          response.clearCookie('guarani:logout', { signed: true });
          break;
      }

      return response.redirect(303, redirectTo);
    } catch (exc: unknown) {
      if (exc instanceof AxiosError) {
        response.json(exc.response?.data);
        return;
      }

      throw exc;
    }
  }
}

export const LogoutController = new Controller();
