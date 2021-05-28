import { Inject, Injectable } from '@guarani/ioc'
import { Objects } from '@guarani/utils'

import { Adapter } from '../adapter'
import {
  AuthorizationRequest as BaseAuthorizationRequest,
  TokenRequest as BaseTokenRequest
} from '../endpoints'
import { InvalidGrant, InvalidRequest } from '../exceptions'
import {
  OAuth2AuthorizationCode,
  OAuth2Client,
  OAuth2Token,
  OAuth2User
} from '../models'
import { PKCEMethods } from '../pkce'
import { generateToken } from '../utils/token'
import { AuthorizationGrant } from './authorization-grant'
import { TokenGrant } from './token-grant'

interface AuthorizationRequest extends BaseAuthorizationRequest {
  readonly code_challenge: string
  readonly code_challenge_method?: string
}

interface AuthorizationResponse {
  readonly code: string
  readonly state?: string
}

interface TokenRequest extends BaseTokenRequest {
  readonly code: string
  readonly redirect_uri: string
  readonly code_verifier: string
}

@Injectable()
export class AuthorizationCodeGrant implements AuthorizationGrant, TokenGrant {
  public readonly grantType: string = 'authorization_code'
  public readonly responseType: string = 'code'
  public readonly responseMode: string = 'query'

  public constructor(@Inject('Adapter') protected readonly adapter: Adapter) {}

  public async authorize(
    data: AuthorizationRequest,
    scopes: string[],
    client: OAuth2Client,
    user: OAuth2User
  ): Promise<AuthorizationResponse> {
    this.checkAuthorizationRequest(data)

    const code = await this.adapter.createAuthorizationCode(
      scopes,
      data,
      client,
      user
    )

    return Objects.removeNullishValues<AuthorizationResponse>({
      code: code.getCode(),
      state: data.state
    })
  }

  protected checkAuthorizationRequest(data: AuthorizationRequest): void {
    const { code_challenge, code_challenge_method } = data

    if (!code_challenge || typeof code_challenge !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "code_challenge".',
        state: data.state
      })
    }

    if (!code_challenge_method || typeof code_challenge_method !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "code_challenge_method".',
        state: data.state
      })
    }
  }

  public async token(
    data: TokenRequest,
    client: OAuth2Client
  ): Promise<OAuth2Token> {
    try {
      this.checkTokenRequest(data)

      const code = await this.adapter.findAuthorizationCode(data.code)

      if (!code) {
        throw new InvalidGrant({
          description: 'Invalid or Expired Authorization Code.'
        })
      }

      this.checkCode(code, data, client)

      const user = await this.adapter.findUser(code.getUserId())

      if (!user) {
        throw new InvalidGrant({ description: 'No User found for this code.' })
      }

      const accessToken = await this.adapter.createAccessToken(
        client,
        user,
        code.getScopes()
      )

      const refreshToken = client.checkGrantType('refresh_token')
        ? await this.adapter.createRefreshToken(client, user, code.getScopes())
        : null

      return generateToken(accessToken, refreshToken)
    } finally {
      await this.adapter.deleteAuthorizationCode(data.code)
    }
  }

  protected checkTokenRequest(data: TokenRequest): void {
    const { code, code_verifier, redirect_uri } = data

    if (!code || typeof code !== 'string') {
      throw new InvalidRequest({ description: 'Invalid parameter "code".' })
    }

    if (!code_verifier || typeof code_verifier !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "code_verifier".'
      })
    }

    if (!redirect_uri || typeof redirect_uri !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "redirect_uri".'
      })
    }
  }

  private checkCode(
    code: OAuth2AuthorizationCode,
    data: TokenRequest,
    client: OAuth2Client
  ): void {
    if (client.getId() !== code.getClientId()) {
      throw new InvalidGrant({ description: 'Mismatching Client ID.' })
    }

    if (!client.checkRedirectUri(data.redirect_uri)) {
      throw new InvalidGrant({ description: 'Invalid Redirect URI.' })
    }

    if (code.getRedirectUri() !== data.redirect_uri) {
      throw new InvalidGrant({ description: 'Mismatching Redirect URI.' })
    }

    const method = PKCEMethods[code.getCodeChallengeMethod() ?? 'plain']

    if (!method(code.getCodeChallenge(), data.code_verifier)) {
      throw new InvalidGrant({ description: 'Invalid Authorization Code.' })
    }
  }
}
