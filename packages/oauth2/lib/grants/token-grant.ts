import { TokenRequest } from '../endpoints'
import { OAuth2Client, OAuth2Token } from '../models'

export interface TokenGrant {
  readonly grantType: string

  token(data: TokenRequest, client: OAuth2Client): Promise<OAuth2Token>
}
