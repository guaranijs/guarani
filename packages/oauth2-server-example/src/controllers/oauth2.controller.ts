import {
  Request as GuaraniRequest,
  RequestParams,
  Response as GuaraniResponse,
  SupportedEndpoint,
} from '@guarani/oauth2-server';

import { Request, Response } from 'express';

import { provider } from '../oauth2/provider';

function createGuaraniRequest(request: Request): GuaraniRequest {
  return new GuaraniRequest(<RequestParams>request);
}

function parseGuaraniResponse(guaraniResponse: GuaraniResponse, response: Response): void {
  response.status(guaraniResponse.statusCode);
  Object.entries(guaraniResponse.headers).forEach(([name, value]) => response.setHeader(name, value!));
  response.send(guaraniResponse.body);
}

async function handleEndpoint(name: SupportedEndpoint, request: Request, response: Response): Promise<void> {
  const guaraniRequest = createGuaraniRequest(request);
  const guaraniResponse = await provider.endpoint(name, guaraniRequest);

  parseGuaraniResponse(guaraniResponse, response);
}

class Controller {
  public async authorize(request: Request, response: Response): Promise<void> {
    await handleEndpoint('authorization', request, response);
  }

  public async token(request: Request, response: Response): Promise<void> {
    await handleEndpoint('token', request, response);
  }

  public async error(request: Request, response: Response): Promise<void> {
    return response.render('oauth2/error', { request, title: 'Authorization Error', ...request.query });
  }
}

export const OAuth2Controller = new Controller();
