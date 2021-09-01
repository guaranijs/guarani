import { Response } from './response'

/**
 * Implementation of an Http Redirection Response.
 */
export class RedirectResponse extends Response {
  /**
   * Instantiates a new Http Redirection Response to the provided URL.
   *
   * @param url URL to where the User-Agent must be redirected to.
   */
  public constructor(url: string) {
    super()

    this._statusCode = 303
    this._headers.Location = url
  }
}
