import { ConsentContextInteractionResponse, ConsentDecisionInteractionResponse } from '@guarani/oauth2-server';

import axios from 'axios';
import { Request, Response } from 'express';
import { URL, URLSearchParams } from 'url';

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

    let consent: ConsentContextInteractionResponse;

    try {
      const { data } = await axios.get(url.href);
      consent = data;
    } catch (exc: any) {
      response.json(exc.response.data);
      return;
    }

    if (consent.skip) {
      return response.redirect(303, consent.request_url);
    }

    return response.render('auth/consent', {
      request,
      title: 'Consent',
      consent,
      consent_challenge: consentChallenge,
      scopes: consent.requested_scope.split(' '),
      error: request.flash('error'),
      success: request.flash('success'),
    });
  }

  public async post(request: Request, response: Response): Promise<void> {
    const { consent_challenge: consentChallenge, grant_scope: grantScope, decision } = request.body;

    if (typeof consentChallenge !== 'string') {
      return response.redirect(303, '');
    }

    const reqBody = new URLSearchParams({ interaction_type: 'consent', consent_challenge: consentChallenge, decision });

    if (decision === 'accept') {
      reqBody.set('grant_scope', grantScope.join(' '));
    } else if (decision === 'deny') {
      reqBody.set('error', 'consent_denied');
      reqBody.set('error_description', 'The user denied the requested scope.');
    } else {
      response.json({ error: 'Invalid parameter "decision".' });
      return;
    }

    try {
      const {
        data: { redirect_to: redirectTo },
      } = await axios.post<ConsentDecisionInteractionResponse>(
        'http://localhost:4000/oauth/interaction',
        reqBody.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      return response.redirect(303, redirectTo);
    } catch (exc: any) {
      response.json(exc.response.data);
    }
  }
}

export const ConsentController = new Controller();
