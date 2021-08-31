import { Response } from './response'

export class RedirectResponse extends Response {
  public constructor(url: string) {
    super()

    this._statusCode = 303
    this._headers.Location = url
  }
}
