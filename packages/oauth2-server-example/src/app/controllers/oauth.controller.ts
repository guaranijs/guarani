import axios from 'axios';
import { Request, Response } from 'express';
import { URLSearchParams } from 'url';

class Controller {
  public async callback(request: Request, response: Response): Promise<void> {
    const parameters = request.query;

    if (parameters.error !== undefined) {
      response.json(parameters);
      return;
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: <string>parameters.code,
      redirect_uri: 'http://localhost:4000/oauth/callback',
      code_verifier: 'tQZ78ORvyh21XgJFNyM4xVrpyFDutQMGWz03fVWO-1c',
    });

    try {
      const accessTokenResponse = await axios.post('/oauth/token', body.toString(), {
        auth: {
          username: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          password: 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX',
        },
        baseURL: 'http://localhost:4000',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      response.json(accessTokenResponse.data);
    } catch (exc: any) {
      response.json(exc.response.data);
    }
  }

  public async error(request: Request, response: Response): Promise<void> {
    const parameters = request.query;

    if (parameters.error === 'login_required') {
      request.logout(() => undefined);
    }

    return response.render('oauth/error', { request, title: 'OAuth 2.0 Error', parameters });
  }
}

export const OAuthController = new Controller();
