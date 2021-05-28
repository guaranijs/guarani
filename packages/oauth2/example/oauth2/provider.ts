import { ClientSecretBasic } from '../../lib/authentication'
import { AuthorizationServer } from '../../lib/bootstrap'
import { IntrospectionEndpoint, RevocationEndpoint } from '../../lib/endpoints'
import {
  AuthorizationCodeGrant,
  ClientCredentialsGrant,
  ImplicitGrant,
  RefreshTokenGrant,
  ResourceOwnerPasswordCredentialsGrant
} from '../../lib/grants'
import { Claim } from '../../lib/models'
import { ExpressProvider } from '../../lib/providers'
import { AppAdapter } from './adapter'

@AuthorizationServer({
  issuer: 'http://localhost:3333',
  adapter: new AppAdapter(),
  claims: [
    Claim.openid,
    Claim.profile,
    Claim.email,
    Claim.phone,
    Claim.address
  ],
  clientAuthentication: [ClientSecretBasic],
  endpoints: [IntrospectionEndpoint, RevocationEndpoint],
  grants: [
    AuthorizationCodeGrant,
    ClientCredentialsGrant,
    ImplicitGrant,
    RefreshTokenGrant,
    ResourceOwnerPasswordCredentialsGrant
  ],
  tokenLifespan: 3600
})
export class AppProvider extends ExpressProvider {}
