import { ConsentContextInteractionResponse, ConsentDecisionInteractionResponse, Display } from '@guarani/oauth2-server';

import axios from 'axios';
import { Request, Response } from 'express';
import { URL, URLSearchParams } from 'url';

const popupTemplateFn = (redirectUri: string): string => `
<script type="text/javascript">
  window.opener.callback('${redirectUri}');
  window.close();
</script>
`;

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    const consentChallenge = <string>request.query.consent_challenge;

    if (typeof consentChallenge !== 'string') {
      return response.render('auth/consent', {
        request,
        title: 'Consent',
        error: request.flash('error'),
        success: request.flash('success'),
      });
    }

    const url = new URL('http://localhost:4000/oauth/interaction');
    const searchParams = new URLSearchParams({ interaction_type: 'consent', consent_challenge: consentChallenge });

    url.search = searchParams.toString();

    const { data } = await axios.get<ConsentContextInteractionResponse>(url.href);

    const { display } = data.context;

    if (display === 'popup') {
      response.cookie('display', 'popup');
    }

    if (data.skip) {
      return this.redirectOrClosePopup(response, data.request_url, display);
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
    const { consent_challenge: consentChallenge, grant_scope: grantScope, decision } = request.body;

    if (typeof consentChallenge !== 'string') {
      return response.redirect(303, '/');
    }

    const reqBody = new URLSearchParams({ interaction_type: 'consent', consent_challenge: consentChallenge, decision });

    switch (decision) {
      case 'accept':
        reqBody.set('grant_scope', grantScope.join(' '));
        break;

      case 'deny':
        reqBody.set('error', 'consent_denied');
        reqBody.set('error_description', 'The user denied the requested scope.');
        break;

      default:
        throw new Error('Invalid parameter "decision".');
    }

    const {
      data: { redirect_to: redirectTo },
    } = await axios.post<ConsentDecisionInteractionResponse>(
      'http://localhost:4000/oauth/interaction',
      reqBody.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const display = <Display>request.cookies.display;

    return this.redirectOrClosePopup(response, redirectTo, display);
  }

  private redirectOrClosePopup(response: Response, url: string, display: Display | undefined): void {
    if (display === 'popup') {
      response.clearCookie('display').send(popupTemplateFn(url));
      return;
    }

    return response.redirect(303, url);
  }
}

export const ConsentController = new Controller();
