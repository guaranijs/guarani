import { Injectable } from '@guarani/ioc'
import {
  JoseError,
  JsonWebKey,
  JsonWebSignature,
  JsonWebSignatureHeader,
  JsonWebToken,
  JsonWebTokenClaims,
  SupportedJWSAlgorithm
} from '@guarani/jose'

import { ClientAuthentication } from '../client-authentication/methods'
import { SupportedClientAssertionType } from '../constants'
import { Request } from '../context'
import { Client } from '../entities'
import { OAuth2Error } from '../exception'

/**
 * Interface of the parameters expected from the POST body.
 */
export interface JWTClientParameters {
  /**
   * Client Assertion provided by the Client.
   */
  readonly client_assertion: string

  /**
   * Client Assertion Type requested by the Client.
   */
  readonly client_assertion_type: SupportedClientAssertionType
}

/**
 * Implementation of the JWT Bearer Client Assertion as described in
 * {@link https://www.rfc-editor.org/rfc/rfc7523.html RFC 7523}.
 */
@Injectable()
export abstract class JWTClientAssertion extends ClientAuthentication {
  /**
   * JWT Bearer Client Assertion Type.
   */
  public readonly CLIENT_ASSERTION_TYPE = SupportedClientAssertionType.JwtBearer

  /**
   * Supported JSON Web Signature Algorithms of the Client Assertion.
   */
  protected abstract readonly SUPPORTED_JWS_ALGORITHMS: SupportedJWSAlgorithm[]

  /**
   * Checks if the current Client Authentication Method
   * has been requested by the Client.
   *
   * @param request Current Request.
   */
  public hasBeenRequested(request: Request): boolean {
    const { client_assertion, client_assertion_type } = <JWTClientParameters>(
      request.body
    )

    if (
      client_assertion_type !== this.CLIENT_ASSERTION_TYPE ||
      client_assertion == null ||
      !JsonWebSignature.isJWS(client_assertion)
    ) {
      return false
    }

    try {
      const [header] = JsonWebToken.decodeJWS(client_assertion)

      if (header.alg === 'none') {
        throw OAuth2Error.InvalidClient('Invalid JWT Client Assertion.')
      }

      return this.SUPPORTED_JWS_ALGORITHMS.includes(header.alg)
    } catch (error) {
      throw error instanceof JoseError
        ? OAuth2Error.InvalidClient(error.message)
        : error
    }
  }

  public async authenticate(request: Request): Promise<Client> {
    const { client_assertion } = <JWTClientParameters>request.body

    try {
      const [header, claims] = await this.checkAssertion(client_assertion)

      const client = await this.getClient(claims.iss)

      if (!client.checkAuthenticationMethod(this.name)) {
        throw OAuth2Error.InvalidClient(
          `This Client is not allowed to use the method "${this.name}".`
        )
      }

      const key = await this.getClientKey(client, header, claims)

      await this.checkClientAssertionSignature(client_assertion, key)

      return client
    } catch (error) {
      throw error instanceof JoseError
        ? OAuth2Error.InvalidClient(error.message)
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
    const [header, claims] = JsonWebToken.decodeJWS(assertion, {
      iss: { essential: true },
      sub: { essential: true },
      aud: { value: this.settings.issuer },
      exp: { essential: true },
      jti: { essential: true }
    })

    if (claims.iss !== claims.sub) {
      throw OAuth2Error.InvalidClient(
        'The value of "iss" and "sub" MUST be identical.'
      )
    }

    await this.adapter.checkJWTAssertionClaims(claims)

    return [header, claims]
  }

  /**
   * Fetches the Client of the Client Assertion from the application's storage.
   *
   * @param clientId ID of the Client that issued the Client Assertion.
   * @returns Client of the Client Assertion.
   */
  private async getClient(clientId: string): Promise<Client> {
    const client = await this.adapter.findClient(clientId)

    if (!client) {
      throw OAuth2Error.InvalidClient('Invalid Credentials.')
    }

    return client
  }

  /**
   * Retrieves the **JSON Web Key** of the Client and the expected
   * **JSON Web Signature Algorithm** used to sign the Client Assertion.
   *
   * @param client Client of the Request.
   * @param header JOSE Header of the Client Assertion.
   * @param claims JSON Web Token Claims of the Client Assertion.
   * @returns **JSON Web Key** of the Client and the expected
   *     **JSON Web Signature Algorithm** used to sign the Client Assertion.
   */
  protected abstract getClientKey(
    client: Client,
    header: JsonWebSignatureHeader,
    claims: JsonWebTokenClaims
  ): Promise<JsonWebKey>

  /**
   * Checks the signature of the Client Assertion.
   *
   * @param assertion Client Assertion provided by the Client.
   * @param key JSON Web Key of the Issuer.
   */
  protected async checkClientAssertionSignature(
    assertion: string,
    key: JsonWebKey
  ): Promise<void> {
    await JsonWebToken.verify(assertion, key)
  }
}
