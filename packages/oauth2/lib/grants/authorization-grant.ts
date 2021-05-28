import { Dict } from '@guarani/utils'

import { AuthorizationRequest } from '../endpoints'
import { OAuth2Client, OAuth2User } from '../models'

export interface AuthorizationGrant {
  readonly responseType: string
  readonly responseMode: string

  authorize(
    data: AuthorizationRequest,
    scopes: string[],
    client: OAuth2Client,
    user: OAuth2User
  ): Promise<Dict<any>>
}
