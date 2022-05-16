import { Injectable } from '@guarani/di';

import { Request, Response, Router } from 'express';

import { AuthorizationServer } from '../../authorization-server/authorization-server';
import { User } from '../../entities/user';
import { HttpRequest } from '../../http/http.request';
import { HttpResponse } from '../../http/http.response';
import { Endpoint } from '../../types/endpoint';
import { HttpMethod } from '../../types/http-method';

/**
 * Integration of Guarani OAuth 2.0 and ExpressJS.
 */
@Injectable()
export class ExpressProvider extends AuthorizationServer {
  /**
   * Express Router used to define the OAuth 2.0 Endpoints.
   */
  public readonly router: Router = Router();

  /**
   * Bootstraps the Express Authorization Server.
   */
  public bootstrap(): void {
    this.endpoints.forEach((endpoint) => {
      endpoint.methods.forEach((method) => {
        this.router[method](endpoint.path, async (req, res) => {
          return await this._getEndpointResponse(endpoint.name, req, res);
        });
      });
    });
  }

  /**
   * Creates a Guarani OAuth 2.0 Http Request based on the Express Request.
   *
   * @param request Express Request.
   * @returns Guarani OAuth 2.0 Http Request.
   */
  private _createOAuth2Request(request: Request): HttpRequest {
    return new HttpRequest({
      body: request.body,
      headers: request.headers,
      method: <HttpMethod>request.method.toLowerCase(),
      query: request.query,
      user: <User>request.user,
    });
  }

  /**
   * Parses the data of the Guarani OAuth 2.0 Http Response into the Express Response.
   *
   * @param oauth2Response Guarani OAuth 2.0 Http Response.
   * @param response Express Response.
   */
  private _parseOAuth2Response(oauth2Response: HttpResponse, response: Response): void {
    const { body, headers, statusCode } = oauth2Response;
    Object.entries(headers).forEach(([name, value]) => response.setHeader(name, value!));
    response.status(statusCode).send(body);
  }

  /**
   * Executes the OAuth 2.0 Endpoint with the data of the Express Request and sets the Express Response.
   *
   * @param endpoint Name of the Endpoint.
   * @param request Express Request.
   * @param response Express Response.
   */
  private async _getEndpointResponse(endpoint: Endpoint, request: Request, response: Response): Promise<void> {
    const oauth2Request = this._createOAuth2Request(request);
    const oauth2Response = await this.endpoint(endpoint, oauth2Request);

    return this._parseOAuth2Response(oauth2Response, response);
  }
}
