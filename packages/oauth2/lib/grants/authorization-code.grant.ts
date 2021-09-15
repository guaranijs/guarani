import { Inject, Injectable, InjectAll } from '@guarani/ioc'
import { applyMixins, OneOrMany, removeNullishValues } from '@guarani/utils'

import { Adapter } from '../adapter'
import {
  SupportedGrantType,
  SupportedPkceMethod,
  SupportedResponseMode,
  SupportedResponseType
} from '../constants'
import { Request } from '../context'
import { AuthorizationCode, Client, User } from '../entities'
import { AccessDenied, InvalidGrant, InvalidRequest } from '../exceptions'
import { PkceMethod } from '../pkce'
import { Settings } from '../settings'
import { OAuth2Token } from './grant'
import { GrantType, TokenParameters } from './grant-type'
import { AuthorizationParameters, ResponseType } from './response-type'

/**
 * Defines the parameters of the Authorization Request.
 */
export interface CodeAuthorizationParameters extends AuthorizationParameters {
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
export interface CodeAuthorizationResponse {
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
export interface CodeTokenParameters extends TokenParameters {
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
export abstract class AuthorizationCodeGrant extends applyMixins([
  ResponseType,
  GrantType
]) {
  /**
   * Name of the Grant.
   */
  public readonly name: SupportedGrantType = 'authorization_code'

  /**
   * Names of the Grant's Response Types.
   */
  public readonly RESPONSE_TYPES: SupportedResponseType[] = ['code']

  /**
   * Default Response Mode of the Grant.
   */
  public readonly DEFAULT_RESPONSE_MODE: SupportedResponseMode = 'query'

  /**
   * Name of the Grant's Grant Type.
   */
  public readonly GRANT_TYPE: SupportedGrantType = 'authorization_code'

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
  protected async authorize(
    request: Request,
    client: Client,
    user: User
  ): Promise<CodeAuthorizationResponse> {
    const data = <CodeAuthorizationParameters>request.data

    const scopes = await this.adapter.checkClientScope(client, data.scope)
    const [audience, grantedScopes] = await this.getAudienceScopes(
      data.resource,
      scopes,
      client,
      user
    )

    const code = await this.createAuthorizationCode(
      data,
      grantedScopes ?? scopes,
      audience,
      client,
      user
    )

    return removeNullishValues<CodeAuthorizationResponse>({
      code: code.getIdentifier(),
      state: data.state
    })
  }

  /**
   * Checks if the provided Code Challenge and PKCE Method are valid.
   *
   * @param challenge Code Challenge provided by the Client.
   * @param method Optional PKCE Method provided by the Client.
   */
  protected checkAuthorizationParameters(
    data: CodeAuthorizationParameters
  ): void {
    // super.checkAuthorizationParameters(data)

    const { code_challenge, code_challenge_method } = data

    if (!code_challenge) {
      throw new InvalidRequest({
        description: 'Invalid parameter "code_challenge".'
      })
    }

    if (
      code_challenge_method &&
      !this.pkceMethods.find(pkce => pkce.name === code_challenge_method)
    ) {
      throw new InvalidRequest({
        description: `Unsupported code_challenge_method "${code_challenge_method}".`
      })
    }
  }

  /**
   * Generates an **Authorization Code** as a temporary grant from the User
   * to the Client for usage at the Token Endpoint.
   *
   * @param data Authorization Parameters of the Authorization Code Grant.
   * @param scopes Scopes granted to the Client.
   *     **It `MAY` differ from the requested scopes**.
   * @param audience Intended Audience of the Authorization Code.
   * @param client Client requesting the Authorization Code.
   * @param user User issuing the Authorization Code to the Client.
   * @returns **Authorization Code** for use by the Client.
   */
  protected abstract createAuthorizationCode(
    data: CodeAuthorizationParameters,
    scopes: string[],
    audience: OneOrMany<string>,
    client: Client,
    user: User
  ): Promise<AuthorizationCode>

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
  protected async token(
    request: Request,
    client: Client
  ): Promise<OAuth2Token> {
    const data = <CodeTokenParameters>request.data

    let code: AuthorizationCode

    try {
      this.checkTokenParameters(data)

      code = await this.getAuthorizationCode(data.code)

      this.checkAuthorizationCode(code, data, client)
      this.checkTokenResource(code, data.resource)

      const [audience, accessTokenScopes] = await this.getAudienceScopes(
        data.resource ?? code.getAudience(),
        code.getScopes(),
        client,
        code.getUser()
      )

      const accessToken = await this.adapter.createAccessToken(
        this.name,
        accessTokenScopes ?? code.getScopes(),
        audience ?? code.getAudience(),
        client,
        code.getUser()
      )

      const refreshToken =
        this.adapter.createRefreshToken &&
        client.checkGrantType('refresh_token')
          ? await this.adapter.createRefreshToken(
              code.getScopes(),
              code.getAudience(),
              client,
              code.getUser(),
              accessToken
            )
          : null

      return this.createTokenResponse(accessToken, refreshToken)
    } finally {
      if (code) {
        await this.revokeAuthorizationCode(code)
      }
    }
  }

  /**
   * Checks if the parameters of the Token Request are valid.
   *
   * @param data Parameters of the Token Request.
   */
  protected checkTokenParameters(data: CodeTokenParameters): void {
    // super.checkTokenParameters(data)

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
   * @throws {InvalidGrant} No Authorization Code was found or it was invalid.
   * @returns Authorization Code based on the provided code.
   */
  private async getAuthorizationCode(code: string): Promise<AuthorizationCode> {
    const authorizationCode = await this.findAuthorizationCode(code)

    if (!authorizationCode) {
      throw new InvalidGrant({ description: 'Invalid Authorization Code.' })
    }

    return authorizationCode
  }

  /**
   * Searches for an Authorization Code in the application's storage
   * and returns it.
   *
   * @param code Code of the Authorization Code to be fetched.
   * @returns Authorization Code based on the provided code.
   */
  protected abstract findAuthorizationCode(
    code: string
  ): Promise<AuthorizationCode>

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
    data: CodeTokenParameters,
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

  /**
   * Revokes the provided Authorization Code from the application's storage.
   *
   * @param authorizationCode Authorization Code to be deleted.
   */
  protected abstract revokeAuthorizationCode(
    authorizationCode: AuthorizationCode
  ): Promise<void>
}

export interface AuthorizationCodeGrant extends ResponseType, GrantType {}
