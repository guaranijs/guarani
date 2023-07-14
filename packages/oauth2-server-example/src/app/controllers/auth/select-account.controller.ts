import axios, { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { stringify as stringifyQs } from 'querystring';
import { In } from 'typeorm';
import { URL } from 'url';

import {
  Display,
  InvalidRequestException,
  SelectAccountContextInteractionResponse,
  SelectAccountDecisionInteractionRequest,
  SelectAccountDecisionInteractionResponse,
} from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { Login } from '../../entities/login.entity';

const popupTemplateFn = (redirectUri: string): string => `
<script type="text/javascript">
  window.opener.callback('${redirectUri}');
  window.close();
</script>
`;

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    const loginChallenge = <string>request.query.login_challenge;

    if (typeof loginChallenge !== 'string') {
      const error = new InvalidRequestException('Invalid parameter "login_challenge".');
      response.json(error.toJSON());
      return;
    }

    const sessionId = request.signedCookies['guarani:session'];

    const url = new URL('http://localhost:4000/oauth/interaction');
    url.search = stringifyQs({
      interaction_type: 'select_account',
      login_challenge: loginChallenge,
      session_id: sessionId,
    });

    try {
      const { data } = await axios.get<SelectAccountContextInteractionResponse>(url.href);
      const logins = await Login.findBy({ id: In(data.logins) });

      const { display } = data.context;

      if (display === 'popup') {
        response.cookie('display', 'popup');
      }

      return response.render('auth/select-account', {
        request,
        title: 'Select Account',
        login_challenge: loginChallenge,
        logins,
      });
    } catch (exc: unknown) {
      if (exc instanceof AxiosError) {
        response.json(exc.response?.data);
        return;
      }

      throw exc;
    }
  }

  public async post(request: Request, response: Response): Promise<void> {
    const { login_challenge: loginChallenge, login_id: loginId } = request.body;

    const requestParameters: SelectAccountDecisionInteractionRequest = {
      interaction_type: 'select_account',
      login_challenge: loginChallenge as string,
      login_id: loginId as string,
    };

    const requestBody = stringifyQs(requestParameters);

    try {
      const {
        data: { redirect_to: redirectTo },
      } = await axios.post<SelectAccountDecisionInteractionResponse>(
        'http://localhost:4000/oauth/interaction',
        requestBody,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const display = request.cookies.display as Display;

      return this.redirectOrClosePopup(response, redirectTo, display);
    } catch (exc: unknown) {
      if (exc instanceof AxiosError) {
        response.json(exc.response?.data);
        return;
      }

      throw exc;
    }
  }

  private redirectOrClosePopup(response: Response, url: string, display: Nullable<Display>): void {
    if (display === 'popup') {
      response.clearCookie('display').send(popupTemplateFn(url));
      return;
    }

    return response.redirect(303, url);
  }
}

export const SelectAccountController = new Controller();
