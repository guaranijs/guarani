import { Attributes, Dict, Optional } from '@guarani/types';

import { IncomingHttpHeaders } from 'http';

import { User } from '../entities/user';
import { HttpMethod } from '../types/http-method';

/**
 * Abstraction of the HTTP Request object used by Guarani.
 *
 * This abstraction is used to facilitate the integration of the OAuth 2.0 Authorization Server Framework
 * with the multiple HTTP Web Servers developed in NodeJS.
 */
export class HttpRequest {
  /**
   * Method of the HTTP Request.
   */
  public readonly method: HttpMethod;

  /**
   * Parsed Query Parameters of the HTTP Request.
   */
  public readonly query: Dict = {};

  /**
   * Headers of the HTTP Request.
   */
  public readonly headers: IncomingHttpHeaders = {};

  /**
   * Body of the HTTP Request.
   */
  public readonly body: Dict;

  /**
   * Authenticated User of the HTTP Request.
   */
  public user?: Optional<User>;

  /**
   * Instantiates a new HTTP Request based on the provided Parameters.
   *
   * @param parameters Parameters of the HTTP Request.
   */
  public constructor(parameters: Attributes<HttpRequest>) {
    const { body, headers, method, query, user } = parameters;

    this.method = <HttpMethod>method.toLowerCase();

    Object.entries(query).forEach(([param, value]) => {
      this.query[param.toLowerCase()] = value;
    });

    Object.entries(headers).forEach(([header, value]) => {
      this.headers[header.toLowerCase()] = value;
    });

    this.body = body;
    this.user = user;
  }
}
