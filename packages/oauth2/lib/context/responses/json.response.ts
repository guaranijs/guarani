import { OAuth2Response, ResponseParams } from './response'

export class OAuth2JSONResponse extends OAuth2Response {
  public constructor(response?: ResponseParams) {
    super(response)

    this.headers['Content-Type'] = 'application/json'
  }

  protected parseBody(body: any): Buffer {
    return Buffer.from(JSON.stringify(body ?? null))
  }
}
