import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

/**
 * Abstraction of the HTTP Response object returned by Guarani.
 *
 * This abstraction is used to facilitate the integration of the OAuth 2.0 Authorization Server Framework
 * with the multiple HTTP Web Servers developed in NodeJS.
 */
export class HttpResponse {
  /**
   * Status Code of the HTTP Response.
   */
  public statusCode: number = 200;

  /**
   * Headers of the HTTP Response.
   */
  public headers: OutgoingHttpHeaders = {};

  /**
   * Encoded Body of the HTTP Response.
   */
  public body: Buffer = Buffer.alloc(0);

  /**
   * Defines the Status Code of the Response.
   *
   * @param statusCode Status Code of the Response.
   */
  public setStatus(statusCode: number): HttpResponse {
    this.statusCode = statusCode;
    return this;
  }

  /**
   * Defines a Header of the Response.
   *
   * @param header Name of the Header.
   * @param value Value of the Header.
   */
  public setHeader(header: string, value: OutgoingHttpHeader): HttpResponse {
    this.headers[header] = value;
    return this;
  }

  /**
   * Defines multiple Headers of the Response.
   *
   * @param headers Dictionary of the Headers.
   */
  public setHeaders(headers: OutgoingHttpHeaders): HttpResponse {
    Object.assign(this.headers, headers);
    return this;
  }

  /**
   * Defines the provided object as the JSON Encoded Body of the Response.
   *
   * @param data Object to be used as the JSON Encoded Body of the Response.
   */
  public json<T>(data: T): HttpResponse {
    this.setHeader('Content-Type', 'application/json');
    this.body = Buffer.from(JSON.stringify(data ?? null), 'utf8');
    return this;
  }

  /**
   * Redirects the User-Agent to the provided URL.
   *
   * @param url URL that the User-Agent will be redirected to.
   */
  public redirect(url: string): HttpResponse;

  /**
   * Redirects the User-Agent to the provided URL.
   *
   * @param url URL that the User-Agent will be redirected to.
   */
  public redirect(url: URL): HttpResponse;

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
    this.body = Buffer.from(html, 'utf8');
    return this;
  }
}
