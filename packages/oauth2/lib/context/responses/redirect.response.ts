import { OAuth2Response } from './response'

interface RedirectResponseParams {
  readonly url: string
}

export class OAuth2RedirectResponse extends OAuth2Response {
  public constructor(response?: RedirectResponseParams) {
    super({ statusCode: 303 })

    this.headers.Location = response?.url
  }
}
