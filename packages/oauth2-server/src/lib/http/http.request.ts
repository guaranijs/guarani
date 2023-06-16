import { Buffer } from 'buffer';
import { IncomingHttpHeaders } from 'http';
import { parse as parseQs } from 'querystring';

import { JSON } from '@guarani/primitives';
import { Dictionary, Json, OneOrMany } from '@guarani/types';

import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { UnsupportedMediaTypeException } from '../exceptions/unsupported-media-type.exception';
import { HttpMethod } from './http-method.type';
import { HttpRequestParameters } from './http-request.parameters';

/**
 * Abstraction of the Http Request.
 *
 * This abstraction is used to facilitate the integration of the OAuth 2.0 Authorization Server Framework
 * with the multiple Http Web Servers developed in NodeJS.
 */
export class HttpRequest {
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
  public readonly query: Dictionary<OneOrMany<string>>;

  /**
   * Headers of the Http Request.
   */
  public readonly headers: IncomingHttpHeaders;

  /**
   * Cookies of the Http Request.
   */
  public readonly cookies: Dictionary<unknown>;

  /**
   * Raw Body of the Http Request.
   */
  #body: Buffer;

  /**
   * Body of the Http Request parsed as **application/x-www-form-urlencoded**.
   */
  #form?: Dictionary<OneOrMany<string>>;

  /**
   * Body of the Http Request parsed as **application/json**.
   */
  #json?: Json;

  /**
   * Instantiates a new Http Request.
   *
   * @param parameters Parameters of the Http Request.
   */
  public constructor(parameters: HttpRequestParameters) {
    this.checkHttpMethod(parameters.method);

    this.method = parameters.method;
    this.path = parameters.url.pathname;
    this.query = parseQs(parameters.url.search.substring(1));
    this.headers = parameters.headers;
    this.cookies = parameters.cookies;
    this.#body = parameters.body;

    Reflect.setPrototypeOf(this.query, Object.prototype);
  }

  /**
   * Returns the contents of the Http Request Body parsed as **application/x-www-form-urlencoded**.
   */
  public form<T extends Dictionary<OneOrMany<string>>>(): T {
    this.expectContentType('application/x-www-form-urlencoded');

    if (!Buffer.isBuffer(this.#form)) {
      this.#form = parseQs(this.#body.toString('utf8'));
      Reflect.setPrototypeOf(this.#form, Object.prototype);
    }

    return this.#form as T;
  }

  /**
   * Returns the contents of the Http Request Body parsed as **application/json**.
   */
  public json<T extends Json>(): T {
    this.expectContentType('application/json');

    try {
      if (typeof this.#json === 'undefined') {
        this.#json = JSON.parse(this.#body.toString('utf8'));
      }

      return this.#json as T;
    } catch (exc: unknown) {
      throw new InvalidRequestException('The Http Request Body is not a valid JSON object.', { cause: exc });
    }
  }

  /**
   * Checks if the Http Method provided by the application is a valid Guarani Http Method.
   *
   * @param method Http Method provided by the application.
   */
  private checkHttpMethod(method: HttpMethod): void {
    if (typeof method !== 'string') {
      throw new TypeError('Invalid Http Method.');
    }

    if (method !== 'DELETE' && method !== 'GET' && method !== 'POST' && method !== 'PUT') {
      throw new TypeError(`Unsupported Http Method "${method}".`);
    }
  }

  /**
   * Checks if the value of the Http Header **Content-Type** is the one expected by the application.
   *
   * @param contentType Expected Content Type.
   */
  private expectContentType(contentType: string): void {
    if (this.headers['content-type'] !== contentType) {
      throw new UnsupportedMediaTypeException(`Unexpected Content Type "${this.headers['content-type']}".`);
    }
  }
}
