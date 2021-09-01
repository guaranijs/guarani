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

/**
 * Defines the parameters of the Authorization Request.
 */
interface AuthorizationParameters extends BaseAuthorizationParameters {
  /**
   * PKCE Code Challenge.
   */
  readonly code_challenge: string

  /**
   * PKCE Method.
   */
  readonly code_challenge_method?: SupportedPkceMethod
}

/**
 * Defines the parameters of the Authorization Response.
 */
interface AuthorizationResponse {
  /**
   * Authorization Code.
   */
  readonly code: string

  /**
   * State of the application prior to the Authorization Request.
   */
  readonly state?: string
}

/**
 * Defines the parameters of the Token Request.
 */
interface TokenParameters extends BaseTokenParameters {
  /**
   * Authorization Code issued by the Authorization Server.
   */
  readonly code: string

  /**
   * Redirect URI provided at the Authorization Request.
   */
  readonly redirect_uri?: string

  /**
   * Code Verifier of the PKCE Code Challenge used by the Client.
   */
  readonly code_verifier: string
}

/**
 * Implementation of the Authorization Code Grant as described in
 * {@link https://www.rfc-editor.org/rfc/rfc6749.html#section-4.1 RFC 6749}.
 *
 * In this grant the client **MUST** obtain an authorization grant from
 * the User and exchange it for an access token. This implementation uses
 * PKCE by default, and enforces its use every time.
 */
@Injectable()
export class AuthorizationCodeGrant
  extends Grant
  implements ResponseType, GrantType {
  /**
   * Name of the Grant.
   */
  public readonly name: SupportedGrantType = 'authorization_code'

  /**
   * Names of the Grant's Response Types.
   */
  public readonly responseTypes: SupportedResponseType[] = ['code']

  /**
   * Default Response Mode of the Grant.
   */
  public readonly defaultResponseMode: SupportedResponseMode = 'query'

  /**
   * Name of the Grant's Grant Type.
   */
  public readonly grantType: SupportedGrantType = 'authorization_code'

  /**
   * Instantiates a new **Authorization Code Grant**
   *
   * @param adapter Adapter provided by the application.
   * @param settings Settings of the Authorization Server.
   * @param pkceMethods PKCE Methods selected by the application.
   */
  public constructor(
    @Inject('Adapter') protected readonly adapter: Adapter,
    protected readonly settings: Settings,
    @InjectAll('PkceMethod') protected readonly pkceMethods: PkceMethod[]
  ) {
    super(adapter, settings)
  }

  /**
   * **Authorization Flow** of the Authorization Code Grant.
   *
   * In this part of the Authorization process the Authorization Server checks
   * the **scopes** requested by the Client and, if authorized by the User,
   * issues an **Authorization Code** as a temporary grant to the Client.
   *
   * The format of the Authorization Response is exemplified as follows:
   *
   * ```json
   *   {
   *     "code": "XUFJGWdzVCx8K153POB1XasJB-gUjeAj",
   *     "state": "VGLgcR2TLMhguh7t"
   *   }
   * ```
   *
   * Both the **Code Challenge** and the **PKCE Method** used by the Client to
   * generate the challenge are registered at the application's storage together
   * with the issued Authorization Code for verification at the Token Flow.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @param user Authenticated User of the Request.
   * @returns Authorization Code Grant's Authorization Response.
   */
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

  /**
   * Checks if the provided Code Challenge and PKCE Method are valid.
   *
   * @param challenge Code Challenge provided by the Client.
   * @param method Optional PKCE Method provided by the Client.
   */
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

  /**
   * **Token Flow** of the Authorization Code Grant.
   *
   * In this part of the Authorization process the Authorization Server checks
   * the validity of the Authorization Code provided by the Client against the
   * Authorization Code metadata saved at the application's storage.
   *
   * If the Client presented a valid Authorization Code that was granted to
   * itself, and if it presented the correct PKCE Code Verifier that matches the
   * Code Challenge presented at the Authorization Endpoint, then the Provider
   * issues an Access Token and, if allowed to the Client, a Refresh Token.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @returns OAuth 2.0 Token Response.
   */
  public async token(request: Request, client: Client): Promise<OAuth2Token> {
    const data = <TokenParameters>request.data

    let code: AuthorizationCode

    try {
      this.checkTokenRequest(data)

      code = await this.getAuthorizationCode(data.code)

      this.checkAuthorizationCode(code, data, client)

      const [accessToken, refreshToken] = await this.issueOAuth2Token(
        code.getScopes(),
        client,
        code.getUser(),
        true
      )

      return this.createTokenResponse(accessToken, refreshToken)
    } finally {
      await this.adapter.revokeAuthorizationCode(code)
    }
  }

  /**
   * Checks if the parameters of the Token Request are valid.
   *
   * @param data Parameters of the Token Request.
   */
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

  /**
   * Fetches the requested Authorization Code from the application's storage.
   *
   * @param code Code provided by the Client.
   * @returns Authorization Code based on the provided code.
   */
  private async getAuthorizationCode(code: string): Promise<AuthorizationCode> {
    const authorizationCode = await this.adapter.findAuthorizationCode(code)

    if (!authorizationCode) {
      throw new InvalidGrant({ description: 'Invalid Authorization Code.' })
    }

    return authorizationCode
  }

  /**
   * Checks the Authorization Code against the provided data and against the
   * Client of the Token Request.
   *
   * @param code Authorization Code fetched to be checked.
   * @param data Parameters of the Token Request.
   * @param client Client of the Request.
   */
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
    This monstruosity only exists due to a possible comparison
    between null and undefined. If you want to see it in action,
    remove the second statement and don't send a Redirect URI
    in both the Authorization and Token Requests.
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

  /**
   * Returns the requested PKCE Method.
   *
   * @param pkceMethod Name of the requested PKCE Method.
   * @returns Requested PKCE Method.
   */
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
