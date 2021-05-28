import { AuthorizationGrant } from './authorization-grant'
import { TokenGrant } from './token-grant'

export type Grant = Partial<AuthorizationGrant> & Partial<TokenGrant>
