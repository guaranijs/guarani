import { AuthorizationServer } from '../../lib/bootstrap'
import { ClientCredentialsGrant, ImplicitGrant } from '../../lib/grants'
import { ExpressProvider } from '../../lib/providers'
import { AppAdapter } from './app-adapter'
import { IntrospectionEndpoint, RevocationEndpoint } from './endpoints'
import {
  AuthorizationCodeGrant,
  PasswordGrant,
  RefreshTokenGrant
} from './grants'

@AuthorizationServer({
  issuer: 'http://localhost:3333',
  adapter: new AppAdapter(),
  grants: [
    AuthorizationCodeGrant,
    ClientCredentialsGrant,
    ImplicitGrant,
    PasswordGrant,
    RefreshTokenGrant
  ],
  endpoints: [IntrospectionEndpoint, RevocationEndpoint]
})
export class AppProvider extends ExpressProvider {}
