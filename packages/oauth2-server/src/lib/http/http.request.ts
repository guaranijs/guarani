import { IncomingHttpHeaders } from 'http';

import { HttpMethod } from './http-method.type';
import { HttpRequestParameters } from './http-request.parameters';

/**
 * Abstraction of the Http Request.
 *
 * This abstraction is used to facilitate the integration of the OAuth 2.0 Authorization Server Framework
 * with the multiple Http Web Servers developed in NodeJS.
 */
export class HttpRequest<TData extends Record<string, any> = Record<string, any>> {
  /**
   * Method of the Http Request.
   */
  public readonly method: HttpMethod;

  /**
   * Path of the Http Request.
   */
  public readonly path: string;

  /**
   * Parsed Query Parameters of the Http Request.
   */
  public readonly query: Record<string, any>;

  /**
   * Headers of the Http Request.
   */
  public readonly headers: IncomingHttpHeaders;

  /**
   * Cookies of the Http Request.
   */
  public readonly cookies: Record<string, any>;

  /**
   * Parsed Body of the Http Request.
   */
  public readonly body: Record<string, any>;

  /**
   * Data of the Http Request based on the Http Method.
   */
  public get data(): TData {
    switch (this.method) {
      case 'GET':
        return <TData>this.query;

      case 'POST':
        return <TData>this.body;
    }
  }

  public constructor(parameters: HttpRequestParameters) {
    this.method = this.checkHttpMethod(parameters.method);
    this.headers = parameters.headers;
    this.cookies = parameters.cookies;
    this.body = parameters.body;
    this.path = parameters.path;
    this.query = parameters.query;
  }

  /**
   * Checks if the Http Method provided by the application is a valid Guarani Http Method.
   *
   * @param method Http Method provided by the application.
   */
  private checkHttpMethod(method: string): HttpMethod {
    if (typeof method !== 'string') {
      throw new Error('The Http Method must be a valid string.');
    }

    if (method !== 'GET' && method !== 'POST') {
      throw new Error(`The Http Method "${method}" is invalid.`);
    }

    return <HttpMethod>method;
  }
}
