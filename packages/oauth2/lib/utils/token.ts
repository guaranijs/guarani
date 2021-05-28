import { Container } from '@guarani/ioc'
import { Objects } from '@guarani/utils'

import { OAuth2AccessToken, OAuth2RefreshToken, OAuth2Token } from '../models'
import { Settings } from '../settings'

export function generateToken(
  accessToken: OAuth2AccessToken,
  refreshToken?: OAuth2RefreshToken
): OAuth2Token {
  const settings = Container.resolve(Settings)

  return Objects.removeNullishValues<OAuth2Token>({
    access_token: accessToken.getAccessToken(),
    token_type: 'Bearer',
    expires_in: settings.tokenLifespan,
    refresh_token: refreshToken?.getRefreshToken(),
    scope: accessToken.getScopes().join(' ')
  })
}
