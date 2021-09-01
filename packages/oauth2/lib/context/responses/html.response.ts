import { Response } from './response'

/**
 * Implementation of an Http Response with an HTML Body.
 */
export class HtmlResponse extends Response {
  /**
   * Instantiates a new HTML Response with the provided HTML Body.
   *
   * @param body HTML to be used as the Body of the Response.
   */
  public constructor(body: string) {
    if (typeof body !== 'string') {
      throw new TypeError('The HTML Response REQUIRES an HTML string body.')
    }

    super()

    this._headers['Content-Type'] = 'text/html; charset=UTF-8'
    this._body = Buffer.from(body)
  }
}
