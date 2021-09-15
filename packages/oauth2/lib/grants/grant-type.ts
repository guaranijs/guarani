import { getContainer, Injectable } from '@guarani/ioc'
import { OneOrMany } from '@guarani/utils'

import { OutgoingHttpHeaders } from 'http'

import { ClientAuthenticator } from '../client-authentication'
import { GUARANI_ENV, SupportedGrantType } from '../constants'
import { JsonResponse, Request, Response } from '../context'
import { Client } from '../entities'
import {
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnauthorizedClient,
  UnsupportedGrantType
} from '../exceptions'
import { Grant, OAuth2Token } from './grant'

/**
 * Defines the default parameters of the Token Request.
 */
export interface TokenParameters {
  /**
   * Grant Type requested by the Client.
   */
  readonly grant_type: SupportedGrantType

  /**
   * Resource requested by the Client.
   */
  readonly resource?: OneOrMany<string>
}

/**
 * Interface of the Token Flow of the OAuth 2.0 Grants.
 */
@Injectable()
export abstract class GrantType extends Grant {
  /**
   * Default HTTP headers to be included in the Response.
   */
  private static readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  }

  /**
   * Client Authenticator instance.
   */
  private static get CLIENT_AUTHENTICATOR(): ClientAuthenticator {
    return getContainer('oauth2').resolve(ClientAuthenticator)
  }

  /**
   * Name of the Grant's Grant Type.
   */
  public abstract readonly GRANT_TYPE: SupportedGrantType

  /**
   * Creates a **Token Response** via a **JSON Response**.
   *
   * This method is responsible for issuing Tokens to Clients
   * that succeed to authenticate within the Authorization Server
   * and have the necessary consent of the Resource Owner.
   *
   * If the Client fails to authenticate within the Authorization Server,
   * does not have the consent of the Resource Owner or provides invalid
   * or insufficient request parameters, it will receive a `400 Bad Request`
   * Error Response with a JSON object describing the error.
   *
   * If the flow succeeds, the Client will then receive its Token
   * in a JSON object containing the Access Token, the Token Type,
   * the Lifespan of the Access Token, the scopes of the Access Token,
   * and an optional Refresh Token, as well as any optional parameters
   * defined by supplementar specifications.
   *
   * @param request Current Request.
   * @returns Token Response.
   */
  public static async createTokenResponse(request: Request): Promise<Response> {
    const data = <TokenParameters>request.data

    try {
      const grant = this.getGrantType(data.grant_type)
      return await grant.handleToken(request)
    } catch (error) {
      const err =
        error instanceof OAuth2Error
          ? error
          : new ServerError({
              description: GUARANI_ENV === 'development' ? error.message : null
            })

      return new JsonResponse(err)
        .status(err.status_code)
        .setHeaders({ ...err.headers, ...GrantType.headers })
    }
  }

  /**
   * Retrieves the requested Grant based on the **grant_type** parameter.
   *
   * @param grantType Requested Grant Type.
   * @throws {UnsupportedGrantType} The requested grant is unsupported.
   * @returns Grant based on the requested **grant_type**.
   */
  private static getGrantType(grantType: string): GrantType {
    if (!grantType) {
      throw new InvalidRequest({
        description: 'Invalid parameter "grant_type".'
      })
    }

    const grants = getContainer('oauth2').resolveAll<GrantType>('Grant')
    const grant = grants.find(grant => grant.GRANT_TYPE === grantType)

    if (!grant) {
      throw new UnsupportedGrantType({
        description: `Unsupported grant_type "${grantType}".`
      })
    }

    return grant
  }

  /**
   * Implementation of the Grant's Token Flow.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @returns OAuth 2.0 Token Response.
   */
  protected abstract token(
    request: Request,
    client: Client
  ): Promise<OAuth2Token>

  /**
   * Handles the Token Workflow of the Grant based on the following steps:
   *
   * * Checks the Parameters of the Token Request.
   * * Authenticates the Client.
   * * Checks the data of the Client against the Token Request.
   * * Invokes the `token()` method to generate the OAuth 2.0 Token.
   * * Returns a JSON Response with the OAuth 2.0 Token back to the Client.
   *
   * @param request Current Request.
   * @returns Token Response.
   */
  private async handleToken(request: Request): Promise<Response> {
    const data = <TokenParameters>request.data

    this.checkTokenParameters(data)
    this.emit('token_request', data)

    const client = await GrantType.CLIENT_AUTHENTICATOR.authenticate(request)

    this.checkClientGrantType(client, data.grant_type)
    this.checkResource(data.resource)

    const token = await this.token(request, client)

    return new JsonResponse(token).setHeaders(GrantType.headers)
  }

  /**
   * Checks the parameters of the Token Request.
   *
   * @param data Parameters of the Token Request.
   * @throws {InvalidRequest} One or more authorization parameters are invalid.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected checkTokenParameters(data: TokenParameters): void {}

  /**
   * Checks if the Client is allowed to use the requested Grant Type.
   *
   * @param client Client requesting authorization.
   * @param grantType Grant Type requested by the Client.
   * @throws {UnauthorizedClient} The Client is not allowed to use
   *   the requested Grant Type.
   */
  private checkClientGrantType(
    client: Client,
    grantType: SupportedGrantType
  ): void {
    if (!client.checkGrantType(grantType)) {
      throw new UnauthorizedClient({
        description:
          'This Client is not allowed to request ' +
          `the grant_type "${grantType}".`
      })
    }
  }
}
