import axios, { AxiosError } from 'axios';
import { Request, Response } from 'express';
import { parse as parseQs, stringify as stringifyQs } from 'querystring';
import { URL } from 'url';

import {
  ConsentContextInteractionResponse,
  ConsentDecision,
  ConsentDecisionInteractionRequest,
  ConsentDecisionInteractionResponse,
  Display,
} from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

const popupTemplateFn = (redirectUri: string): string => `
<script type="text/javascript">
  window.opener.callback('${redirectUri}');
  window.close();
</script>
`;

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    const consentChallenge = request.query.consent_challenge as string;

    if (typeof consentChallenge !== 'string') {
      return response.render('auth/consent', {
        request,
        title: 'Consent',
        error: request.flash('error'),
        success: request.flash('success'),
      });
    }

    const url = new URL('http://localhost:4000/oauth/interaction');
    url.search = stringifyQs({ interaction_type: 'consent', consent_challenge: consentChallenge });

    const { data } = await axios.get<ConsentContextInteractionResponse>(url.href);

    const { display } = data.context;

    if (display === 'popup') {
      response.cookie('display', 'popup');
    }

    if (data.skip) {
      return this.redirectOrClosePopup(response, data.request_url, display ?? null);
    }

    return response.render('auth/consent', {
      request,
      title: 'Consent',
      consent: data,
      consent_challenge: consentChallenge,
      scopes: data.requested_scope.split(' '),
      error: request.flash('error'),
      success: request.flash('success'),
    });
  }

  public async post(request: Request, response: Response): Promise<void> {
    const parsedBody = parseQs(request.body.toString('utf8'));

    const { consent_challenge: consentChallenge, grant_scope: grantScope, decision } = parsedBody;

    if (typeof consentChallenge !== 'string') {
      return response.redirect(303, '/');
    }

    const reqData: ConsentDecisionInteractionRequest = {
      interaction_type: 'consent',
      consent_challenge: consentChallenge,
      decision: decision as ConsentDecision,
    };

    switch (decision) {
      case 'accept':
        reqData.grant_scope = (grantScope as string[]).join(' ');
        break;

      case 'deny':
        reqData.error = 'consent_denied';
        reqData.error_description = 'The user denied the requested scope.';
        break;

      default:
        throw new Error('Invalid parameter "decision".');
    }

    const reqBody = stringifyQs(reqData);

    try {
      const {
        data: { redirect_to: redirectTo },
      } = await axios.post<ConsentDecisionInteractionResponse>('http://localhost:4000/oauth/interaction', reqBody, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

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

export const ConsentController = new Controller();
