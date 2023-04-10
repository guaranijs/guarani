import { CodeAuthorizationRequest } from '@guarani/oauth2-server';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { URL, URLSearchParams } from 'url';

import { Client } from '../entities/client.entity';

class Controller {
  public async home(request: Request, response: Response): Promise<void> {
    const clients = await Client.find();

    return response.render('home', { request, title: 'Home', clients });
  }

  public async authorize(request: Request, response: Response): Promise<void> {
    const { client_id: clientId } = request.body;

    const client = await Client.findOneByOrFail({ id: clientId });

    const parameters: CodeAuthorizationRequest = {
      response_type: 'code',
      client_id: client.id,
      redirect_uri: client.redirectUris[0]!,
      scope: 'openid profile email phone address',
      state: randomUUID(),
      code_challenge: 'kRaf6IMJlerQjcqlFczEUYUcVsdwMpYonctl1yXYiiI',
      code_challenge_method: 'S256',
      prompt: 'login consent',
      acr_values: 'urn:guarani:acr:1fa',
    };

    const url = new URL('http://localhost:4000/oauth/authorize');
    const searchParameters = new URLSearchParams(parameters);

    url.search = searchParameters.toString();

    return response.redirect(303, url.href);
  }
}

export const HomeController = new Controller();
