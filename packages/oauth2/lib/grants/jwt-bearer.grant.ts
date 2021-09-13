import { Injectable } from '@guarani/ioc'
import {
  JoseError,
  JsonWebKey,
  JsonWebSignatureHeader,
  JsonWebToken,
  JsonWebTokenClaims,
  SupportedJWSAlgorithm
} from '@guarani/jose'

import { GUARANI_ENV, SupportedGrantType } from '../constants'
import { Request } from '../context'
import { Client, User } from '../entities'
import { InvalidGrant, InvalidRequest } from '../exceptions'
import { Grant, OAuth2Token } from './grant'
import { GrantType, TokenParameters } from './grant-type'

/**
 * Defines the parameters of the **JWT Bearer Grant's** Token Request.
 */
export interface JWTBearerTokenParameters extends TokenParameters {
  /**
   * Assertion containing the data about the User's Grant.
   */
  readonly assertion: string

  /**
   * Scope requested by the Client.
   */
  readonly scope?: string
}

/**
 * Implementation of the JWT Bearer Grant as described in
 * {@link https://www.rfc-editor.org/rfc/rfc7523.html RFC 7523}.
 *
 * In this Grant the Client presents an Assertion containing the Grant provided
 * by the User and exchanges it for an Access Token.
 * A Refresh Token is **NOT** issued.
 */
@Injectable()
export abstract class JWTBearerGrant extends Grant implements GrantType {
  /**
   * Name of the Grant.
   */
  public readonly name: SupportedGrantType =
    'urn:ietf:params:oauth:grant-type:jwt-bearer'

  /**
   * Name of the Grant's Grant Type.
   */
  public readonly GRANT_TYPE: SupportedGrantType =
    'urn:ietf:params:oauth:grant-type:jwt-bearer'

  /**
   * **Token Flow** of the JWT Bearer Grant.
   *
   * In this flow the Authorization Server checks the provided Assertion and,
   * if valid, issues an Access Token. A Refresh Token is **NOT** issued.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @returns OAuth 2.0 Token Response.
   */
  public async token(request: Request, client: Client): Promise<OAuth2Token> {
    const data = <JWTBearerTokenParameters>request.data

    try {
      const scopes = await this.adapter.checkClientScope(client, data.scope)
      const [audience, grantedScopes] = await this.getAudienceScopes(
        data.resource,
        scopes,
        client,
        null
      )

      const [header, claims] = await this.checkAssertion(data.assertion)
      const [key, algorithm] = await this.getIssuerKey(client, header, claims)

      await this.checkAssertionSignature(data.assertion, key, algorithm)

      const user = await this.authenticateUser(claims.sub)

      if (!user) {
        throw new InvalidGrant({ description: 'Invalid User.' })
      }

      const [accessToken] = await this.issueOAuth2Token(
        grantedScopes ?? scopes,
        audience,
        client,
        user,
        false
      )

      return this.createTokenResponse(accessToken)
    } catch (error) {
      throw error instanceof JoseError
        ? new InvalidGrant({
            description: GUARANI_ENV === 'development' ? error.message : null
          })
        : error
    }
  }

  /**
   * Parses the assertion without validating its signature and returns its
   * JOSE Header and JSON Web Token Claims.
   *
   * @param assertion Assertion provided by the Client.
   * @returns JOSE Header and JSON Web Token Claims of the Assertion.
   */
  private async checkAssertion(
    assertion: string
  ): Promise<[JsonWebSignatureHeader, JsonWebTokenClaims]> {
    if (!assertion) {
      throw new InvalidRequest({
        description: 'Invalid parameter "assertion".'
      })
    }

    const [header, claims] = JsonWebToken.decodeJWS(assertion, {
      iss: { essential: true },
      sub: { essential: true },
      aud: { value: this.settings.issuer },
      exp: { essential: true },
      jti: { essential: true }
    })

    await this.adapter.checkJWTAssertionClaims(claims)

    return [header, claims]
  }

  /**
   *
   * @param client Client of the Request.
   * @param header JOSE Header of the Assertion.
   * @param claims JSON Web Token Claims of the Assertion.
   * @returns **JSON Web Key** of the Issuer and the expected
   *     **JSON Web Signature Algorithm** used to sign the Assertion.
   */
  protected abstract getIssuerKey(
    client: Client,
    header: JsonWebSignatureHeader,
    claims: JsonWebTokenClaims
  ): Promise<[JsonWebKey, SupportedJWSAlgorithm?]>

  /**
   * Checks the signature of the Assertion.
   *
   * @param assertion Assertion provided by the Client.
   * @param key JSON Web Key of the Issuer.
   * @param algorithm Expected JSON Web Signature Algorithm of the Assertion.
   */
  private async checkAssertionSignature(
    assertion: string,
    key: JsonWebKey,
    algorithm?: SupportedJWSAlgorithm
  ): Promise<void> {
    await JsonWebToken.verify(assertion, key, algorithm)
  }

  /**
   * Fetches the User represented by the Assertion.
   *
   * @param userId Identifier of the Subject Claim of the Assertion.
   * @returns User represented by the Subject Claim of the Assertion.
   */
  protected abstract authenticateUser(userId: string): Promise<User>
}
