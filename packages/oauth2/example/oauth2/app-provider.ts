import { AuthorizationServer } from '../../lib/bootstrap'
import { RevocationEndpoint } from '../../lib/endpoints'
import {
  AuthorizationCodeGrant,
  ClientCredentialsGrant,
  ImplicitGrant,
  PasswordGrant,
  RefreshTokenGrant
} from '../../lib/grants'
import { ExpressProvider } from '../../lib/providers'
import { AppAdapter } from './app-adapter'

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
  endpoints: [RevocationEndpoint]
})
export class AppProvider extends ExpressProvider {}
