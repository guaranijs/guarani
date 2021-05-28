import { OAuth2Response, ResponseParams } from './response'

interface HTMLResponseParams extends ResponseParams {
  readonly body: string
}

export class OAuth2HTMLResponse extends OAuth2Response {
  public constructor(response?: HTMLResponseParams) {
    if (typeof response?.body !== 'string')
      throw new TypeError('The HTML Response REQUIRES an HTML string body.')

    super(response)

    this.headers['Content-Type'] = 'text/html; charset=UTF-8'
  }
}
