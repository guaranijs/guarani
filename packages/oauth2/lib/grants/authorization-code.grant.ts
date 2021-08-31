import { Inject, Injectable, InjectAll } from '@guarani/ioc'
import { removeNullishValues } from '@guarani/utils'

import { Adapter } from '../adapter'
import {
  SupportedGrantType,
  SupportedPkceMethod,
  SupportedResponseMode,
  SupportedResponseType
} from '../constants'
import { Request } from '../context'
import { AuthorizationCode, Client, OAuth2Token, User } from '../entities'
import { AccessDenied, InvalidGrant, InvalidRequest } from '../exceptions'
import { PkceMethod } from '../pkce'
import { Settings } from '../settings'
import { Grant } from './grant'
import { GrantType, TokenParameters as BaseTokenParameters } from './grant-type'
import {
  AuthorizationParameters as BaseAuthorizationParameters,
  ResponseType
} from './response-type'

interface AuthorizationParameters extends BaseAuthorizationParameters {
  readonly code_challenge: string
  readonly code_challenge_method?: SupportedPkceMethod
}

interface AuthorizationResponse {
  readonly code: string
  readonly state?: string
  readonly [parameter: string]: any
}

interface TokenParameters extends BaseTokenParameters {
  readonly code: string
  readonly redirect_uri?: string
  readonly code_verifier: string
}

@Injectable()
export class AuthorizationCodeGrant
  extends Grant
  implements ResponseType, GrantType {
  public readonly name: SupportedGrantType = 'authorization_code'

  public readonly responseTypes: SupportedResponseType[] = ['code']

  public readonly defaultResponseMode: SupportedResponseMode = 'query'

  public readonly grantType: SupportedGrantType = 'authorization_code'

  public constructor(
    @Inject('Adapter') protected readonly adapter: Adapter,
    protected readonly settings: Settings,
    @InjectAll('PkceMethod') protected readonly pkceMethods: PkceMethod[]
  ) {
    super(adapter, settings)
  }

  public async authorize(
    request: Request,
    client: Client,
    user: User
  ): Promise<AuthorizationResponse> {
    const data = <AuthorizationParameters>request.data

    this.checkCodeChallenge(data.code_challenge, data.code_challenge_method)

    const scopes = await this.adapter.checkClientScope(client, data.scope)
    const code = await this.adapter.createAuthorizationCode(
      data,
      scopes,
      client,
      user
    )

    return removeNullishValues<AuthorizationResponse>({
      code: code.getCode(),
      state: data.state
    })
  }

  private checkCodeChallenge(
    challenge: string,
    method?: SupportedPkceMethod
  ): void {
    if (!challenge) {
      throw new InvalidRequest({
        description: 'Invalid parameter "code_challenge".'
      })
    }

    if (method && !this.pkceMethods.find(pkce => pkce.name === method)) {
      throw new InvalidRequest({
        description: `Unsupported code_challenge_method "${method}".`
      })
    }
  }

  public async token(request: Request, client: Client): Promise<OAuth2Token> {
    const data = <TokenParameters>request.data

    try {
      this.checkTokenRequest(data)

      const code = await this.getAuthorizationCode(data.code)

      this.checkAuthorizationCode(code, data, client)

      const [accessToken, refreshToken] = await this.issueOAuth2Token(
        code.getScopes(),
        client,
        code.getUser(),
        true
      )

      return this.createTokenResponse(accessToken, refreshToken)
    } finally {
      await this.adapter.revokeAuthorizationCode(data.code)
    }
  }

  private checkTokenRequest(data: TokenParameters): void {
    const { code, code_verifier } = data

    if (!code) {
      throw new InvalidRequest({ description: 'Invalid parameter "code".' })
    }

    if (!code_verifier) {
      throw new InvalidRequest({
        description: 'Invalid parameter "code_verifier".'
      })
    }
  }

  private async getAuthorizationCode(code: string): Promise<AuthorizationCode> {
    const authorizationCode = await this.adapter.findAuthorizationCode(code)

    if (!authorizationCode) {
      throw new InvalidGrant({ description: 'Invalid Authorization Code.' })
    }

    return authorizationCode
  }

  private checkAuthorizationCode(
    code: AuthorizationCode,
    data: TokenParameters,
    client: Client
  ): void {
    if (new Date() > code.getExpiresAt()) {
      throw new InvalidGrant({ description: 'Expired Authorization Code.' })
    }

    if (client.getClientId() !== code.getClient().getClientId()) {
      throw new InvalidGrant({ description: 'Mismatching Client ID.' })
    }

    if (data.redirect_uri && !client.checkRedirectUri(data.redirect_uri)) {
      throw new AccessDenied({ description: 'Invalid Redirect URI.' })
    }

    /*
    This monstruosity only exists due to a possible comparison between
    null and undefined. If you want to see it in action, remove the second
    statement and don't send a Redirect URI in both the Authorization and
    the Token Requests.
     */
    if (
      code.getRedirectUri() !== data.redirect_uri &&
      !(data.redirect_uri == null && code.getRedirectUri() == null)
    ) {
      throw new InvalidGrant({ description: 'Mismatching Redirect URI.' })
    }

    const method = this.getPkceMethod(code.getCodeChallengeMethod() ?? 'plain')

    if (!method.compare(code.getCodeChallenge(), data.code_verifier)) {
      throw new InvalidGrant({ description: 'Invalid Authorization Code.' })
    }
  }

  private getPkceMethod(pkceMethod: SupportedPkceMethod): PkceMethod {
    const method = this.pkceMethods.find(method => method.name === pkceMethod)

    if (!method) {
      throw new InvalidRequest({
        description: `Unsupported PKCE Method "${pkceMethod}".`
      })
    }

    return method
  }
}
