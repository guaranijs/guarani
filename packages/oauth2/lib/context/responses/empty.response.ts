import { OAuth2Response, ResponseParams } from './response'

type EmptyResponseParams = Omit<ResponseParams, 'body'>

export class OAuth2EmptyResponse extends OAuth2Response {
  public constructor(response?: EmptyResponseParams) {
    super(response)
  }
}
