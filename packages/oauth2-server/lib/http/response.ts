import { Dict } from '@guarani/types';

import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http';

/**
 * Abstraction of the HTTP Response object received by the application.
 *
 * This class contains the necessary parameters for the correct implementation
 * of the **OAuth 2.0 Protocol** and its extensions.
 */
export class Response {
  /**
   * Status Code of the Response.
   */
  private _statusCode: number = 200;

  /**
   * Headers of the Response.
   */
  private _headers: OutgoingHttpHeaders = {};

  /**
   * Encoded Body of the Response.
   */
  private _body: Buffer = Buffer.alloc(0);

  /**
   * Status Code of the Response.
   */
  public get statusCode(): number {
    return this._statusCode;
  }

  /**
   * Headers of the Response.
   */
  public get headers(): OutgoingHttpHeaders {
    return this._headers;
  }

  /**
   * Encoded Body of the Response.
   */
  public get body(): Buffer {
    return this._body;
  }

  /**
   * Defines the Status Code of the Response.
   *
   * @param statusCode Status Code of the Response.
   */
  public status(statusCode: number): Response {
    this._statusCode = statusCode;
    return this;
  }

  /**
   * Defines a Header of the Response.
   *
   * @param header Name of the Header.
   * @param value Value of the Header.
   */
  public setHeader(header: string, value: OutgoingHttpHeader): Response {
    this._headers[header] = value;
    return this;
  }

  /**
   * Defines multiple Headers of the Response.
   *
   * @param headers Dictionary of the Headers.
   */
  public setHeaders(headers: OutgoingHttpHeaders): Response {
    Object.assign(this._headers, headers);
    return this;
  }

  /**
   * Defines the provided object as the JSON Encoded Body of the Response.
   *
   * @param data Object to be used as the JSON Encoded Body of the Response.
   */
  public json<T extends Dict>(data: T): Response {
    this.setHeader('Content-Type', 'application/json');
    this._body = Buffer.from(JSON.stringify(data), 'utf8');
    return this;
  }

  /**
   * Redirects the User-Agent to the provided URL.
   *
   * @param url URL that the User-Agent will be redirected to.
   */
  public redirect(url: string): Response {
    this.setHeader('Location', url);
    this.status(303);
    return this;
  }

  /**
   * Defines the provided HTML String as the Body of the Response.
   *
   * @param html HTML String to be used as the Body of the Response.
   */
  public html(html: string): Response {
    this.setHeader('Content-Type', 'text/html; charset=UTF-8');
    this._body = Buffer.from(html, 'utf8');
    return this;
  }
}
