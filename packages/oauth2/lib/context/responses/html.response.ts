import { Response } from './response'

export class HtmlResponse extends Response {
  public constructor(body: string) {
    if (typeof body !== 'string') {
      throw new TypeError('The HTML Response REQUIRES an HTML string body.')
    }

    super()

    this._headers['Content-Type'] = 'text/html; charset=UTF-8'
    this._body = Buffer.from(body)
  }
}
