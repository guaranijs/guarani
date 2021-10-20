import { Dict } from '@guarani/utils'

import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http'
import { URL } from 'url'

/**
 * Implementation of the OAuth 2.0 Response.
 *
 * It has roughly the same attributes and methods of a response of a web framework.
 *
 * It is provided as a framework-agnostic version of the response to allow
 * for multiple integrations without breaking functionality.
 */
export class Response {
  /**
   * Status Code of the Response.
   */
  protected _statusCode: number = 200

  /**
   * Headers of the Response.
   */
  protected _headers: OutgoingHttpHeaders = {}

  /**
   * Body of the Response.
   */
  protected _body: Buffer = Buffer.from([])

  /**
   * Status Code of the Response.
   */
  public get statusCode(): number {
    return this._statusCode
  }

  /**
   * Headers of the Response.
   */
  public get headers(): OutgoingHttpHeaders {
    return this._headers
  }

  /**
   * Body of the Response.
   */
  public get body(): Buffer {
    return this._body
  }

  /**
   * Sets a new HTTP Status Code for the Response.
   *
   * @param statusCode HTTP Status Code.
   */
  public status(statusCode: number): Response {
    this._statusCode = statusCode

    return this
  }

  /**
   * Sets an HTTP Header on the Response.
   *
   * @param name Name of the HTTP Header.
   * @param value Value of the HTTP Header.
   */
  public setHeader(name: string, value: OutgoingHttpHeader): Response {
    this._headers[name] = value

    return this
  }

  /**
   * Sets multiple HTTP Headers on the Response.
   *
   * @param values Dictionary of the HTTP Headers.
   */
  public setHeaders(values: OutgoingHttpHeaders): Response {
    Object.assign(this._headers, values)

    return this
  }

  /**
   * Sets the Body of the Response.
   *
   * @param body Buffer compiled Body.
   */
  protected setBody(body: Buffer): Response {
    this._body = body

    return this
  }

  /**
   * Defines the body of the Response as an HTML document.
   *
   * @param html HTML to be used as the Body of the Response.
   */
  public html(html: string): Response {
    this.setHeader('Content-Type', 'text/html; charset=UTF-8').setBody(
      Buffer.from(html)
    )

    return this
  }

  /**
   * Defines the body of the Response as a JSON payload.
   *
   * @param data JSON data to be used as the Body of the Response.
   */
  public json<T extends Dict>(data: T): Response {
    this.setHeader('Content-Type', 'application/json').setBody(
      Buffer.from(JSON.stringify(data ?? null))
    )

    return this
  }

  /**
   * Defines the URL to where the User-Agent will be redirected to.
   *
   * @param url URL to where the User-Agent must be redirected to.
   */
  public redirect(url: URL): Response {
    this.status(303).setHeader('Location', url.href)

    return this
  }
}
