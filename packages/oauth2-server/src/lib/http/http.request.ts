import { IncomingHttpHeaders } from 'http';

import { HttpMethod } from './http-method.type';

/**
 * Abstraction of the Http Request.
 *
 * This abstraction is used to facilitate the integration of the OAuth 2.0 Authorization Server Framework
 * with the multiple Http Web Servers developed in NodeJS.
 */
export interface HttpRequest {
  /**
   * Method of the Http Request.
   */
  readonly method: HttpMethod;

  /**
   * Path of the Http Request.
   */
  readonly path: string;

  /**
   * Parsed Query Parameters of the Http Request.
   */
  readonly query: Record<string, any>;

  /**
   * Headers of the Http Request.
   */
  readonly headers: IncomingHttpHeaders;

  /**
   * Cookies of the Http Request.
   */
  readonly cookies: Record<string, any>;

  /**
   * Parsed Body of the Http Request.
   */
  readonly body: Record<string, any>;
}
