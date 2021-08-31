import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http'

/**
 * Implementation of the OAuth 2.0 Response.
 *
 * It has roughly the same attributes and methods of a response of a web framework.
 *
 * It is provided as a framework-agnostic version of the response to allow
 * for multiple integrations without breaking functionality.
 */
export abstract class Response {
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

  public status(statusCode: number): Response {
    this._statusCode = statusCode
    return this
  }

  public setHeader(name: string, value: OutgoingHttpHeader): Response {
    this._headers[name] = value
    return this
  }

  public setHeaders(values: OutgoingHttpHeaders): Response {
    Object.assign(this._headers, values)
    return this
  }
}
