import { Buffer } from 'buffer';
import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { Dictionary } from '@guarani/types';

/**
 * Abstraction of the Http Response.
 *
 * This abstraction is used to facilitate the integration of the OAuth 2.0 Authorization Server Framework
 * with the multiple Http Web Servers developed in NodeJS.
 */
export class HttpResponse {
  /**
   * Internal Status Code of the Http Response.
   */
  #statusCode = 200;

  /**
   * Internal Headers of the Http Response.
   */
  #headers: OutgoingHttpHeaders = {};

  /**
   * Internal Cookies of the Http Response.
   */
  #cookies: Dictionary<unknown> = {};

  /**
   * Internal Encoded Body of the Http Response.
   */
  #body: Buffer = Buffer.alloc(0);

  /**
   * Status Code of the Http Response.
   */
  public get statusCode(): number {
    return this.#statusCode;
  }

  /**
   * Headers of the Http Response.
   */
  public get headers(): OutgoingHttpHeaders {
    return this.#headers;
  }

  /**
   * Cookies of the Http Response.
   */
  public get cookies(): Dictionary<unknown> {
    return this.#cookies;
  }

  /**
   * Encoded Body of the Http Response.
   */
  public get body(): Buffer {
    return this.#body;
  }

  /**
   * Defines the Status Code of the Response.
   *
   * @param statusCode Status Code of the Response.
   */
  public setStatus(statusCode: number): HttpResponse {
    this.#statusCode = statusCode;
    return this;
  }

  /**
   * Defines a Header of the Response.
   *
   * @param header Name of the Header.
   * @param value Value of the Header.
   */
  public setHeader(header: string, value: OutgoingHttpHeader): HttpResponse {
    this.#headers[header] = value;
    return this;
  }

  /**
   * Defines multiple Headers of the Response.
   *
   * @param headers Dictionary of the Headers.
   */
  public setHeaders(headers: OutgoingHttpHeaders): HttpResponse {
    Object.assign(this.#headers, headers);
    return this;
  }

  /**
   * Defines a Cookie of the Response.
   *
   * @param cookie Name of the Cookie.
   * @param value Value of the Cookie.
   */
  public setCookie(cookie: string, value: unknown): HttpResponse {
    this.#cookies[cookie] = value;
    return this;
  }

  /**
   * Defines multiple Cookies of the Response.
   *
   * @param cookies Dictionary of the Cookies.
   */
  public setCookies(cookies: Dictionary<unknown>): HttpResponse {
    Object.assign(this.#cookies, cookies);
    return this;
  }

  /**
   * Defines the provided object as the JSON Encoded Body of the Response.
   *
   * @param data Object to be used as the JSON Encoded Body of the Response.
   */
  public json<T>(data: T): HttpResponse {
    this.setHeader('Content-Type', 'application/json');
    this.#body = Buffer.from(JSON.stringify(data ?? null), 'utf8');
    return this;
  }

  /**
   * Redirects the User-Agent to the provided URL.
   *
   * @param url URL that the User-Agent will be redirected to.
   */
  public redirect(url: string | URL): HttpResponse {
    this.setHeader('Location', typeof url === 'string' ? url : url.href);
    this.setStatus(303);
    return this;
  }

  /**
   * Defines the provided HTML String as the Body of the Response.
   *
   * @param html HTML String to be used as the Body of the Response.
   */
  public html(html: string): HttpResponse {
    this.setHeader('Content-Type', 'text/html; charset=UTF-8');
    this.#body = Buffer.from(html, 'utf8');
    return this;
  }

  /**
   * Defines the provided JSON Web Token as the Body of the Response.
   *
   * @param jwt JSON Web Token to be used as the Body of the Response.
   */
  public jwt(jwt: string): HttpResponse {
    this.setHeader('Content-Type', 'application/jwt');
    this.#body = Buffer.from(jwt, 'utf8');
    return this;
  }
}
