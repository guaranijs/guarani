import {
  AuthorizationCodeGrant,
  AuthorizationServer,
  Claim,
  ClientCredentialsGrant,
  ClientSecretBasic,
  ExpressProvider,
  ImplicitGrant,
  IntrospectionEndpoint,
  RefreshTokenGrant,
  ResourceOwnerPasswordCredentialsGrant,
  RevocationEndpoint
} from '../../lib'

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
