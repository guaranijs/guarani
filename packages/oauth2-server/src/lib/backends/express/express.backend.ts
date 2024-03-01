import { Request, RequestHandler, Response, Router } from 'express';
import { URL } from 'url';

import { Injectable } from '@guarani/di';

import { AuthorizationServer } from '../../authorization-server';
import { Endpoint } from '../../endpoints/endpoint.type';
import { HttpRequest } from '../../http/http.request';
import { HttpResponse } from '../../http/http.response';
import { HttpMethod } from '../../http/http-method.type';

type ExpressHttpMethod = 'get' | 'post';

/**
 * OAuth 2.0 Authorization Server ExpressJS Backend.
 */
@Injectable()
export class ExpressBackend extends AuthorizationServer {
  /**
   * Express Router used to define the OAuth 2.0 Endpoints.
   */
  public readonly router: Router = Router();

  /**
   * Bootstraps the Express Authorization Server.
   */
  public async bootstrap(): Promise<void> {
    this.logger.information(`[${this.constructor.name}] Called bootstrap()`, 'bcecfffa-8b03-44f7-9971-226134e6a2b0');

    this.endpoints.forEach((endpoint) => {
      endpoint.httpMethods.forEach((method) => {
        this.router[method.toLowerCase() as ExpressHttpMethod](endpoint.path, this._mountEndpoint(endpoint.name));
      });
    });
  }

  /**
   * Mounts the OAuth 2.0 Endpoint as an ExpressJS Route.
   *
   * @param endpoint Name of the Endpoint.
   */
  private _mountEndpoint(endpoint: Endpoint): RequestHandler {
    this.logger.information(`[${this.constructor.name}] Mounting Endpoint`, 'e5a01964-cf8f-4df5-b852-5efdb75bef6d', {
      endpoint,
    });

    return async (request: Request, response: Response): Promise<void> => {
      const oauth2Request = this._createOAuth2Request(request);
      const oauth2Response = await this.endpoint(endpoint, oauth2Request);

      return this._parseOAuth2Response(oauth2Response, response);
    };
  }

  /**
   * Creates an OAuth 2.0 Http Request from the provided Express Request.
   *
   * @param request Express Request.
   * @returns OAuth 2.0 Http Request.
   */
  private _createOAuth2Request(request: Request): HttpRequest {
    this.logger.debug(`[${this.constructor.name}] Parsing the Request`, 'b3f6e5f3-0d66-4dea-a122-081f4a77ce9c');

    return new HttpRequest({
      method: <HttpMethod>request.method.toUpperCase(),
      url: new URL(`${request.protocol}://${request.get('host')}${request.originalUrl}`),
      headers: request.headers,
      cookies: request.signedCookies,
      body: request.body,
    });
  }

  /**
   * Parses the data of the OAuth 2.0 Http Response into the Express Response.
   *
   * @param oauth2Response OAuth 2.0 Http Response.
   * @param response Express Response.
   */
  private _parseOAuth2Response(oauth2Response: HttpResponse, response: Response): void {
    this.logger.debug(
      `[${this.constructor.name}] Parsing the OAuth 2.0 Response`,
      'b3f6e5f3-0d66-4dea-a122-081f4a77ce9c',
      { oauth2_response: oauth2Response },
    );

    const { body, cookies, headers, statusCode } = oauth2Response;

    Object.entries(headers).forEach(([name, value]) => {
      response.setHeader(name, value!);
    });

    Object.entries(cookies).forEach(([name, value]) => {
      value === null ? response.clearCookie(name, { signed: true }) : response.cookie(name, value, { signed: true });
    });

    response.status(statusCode).send(body);
  }
}
