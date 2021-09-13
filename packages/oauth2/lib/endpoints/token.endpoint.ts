import { Injectable, InjectAll } from '@guarani/ioc'

import { OutgoingHttpHeaders } from 'http'

import { ClientAuthenticator } from '../client-authentication'
import {
  GUARANI_ENV,
  SupportedEndpoint,
  SupportedGrantType
} from '../constants'
import { JsonResponse, Request, Response } from '../context'
import { Client } from '../entities'
import {
  OAuth2Error,
  ServerError,
  UnauthorizedClient,
  UnsupportedGrantType
} from '../exceptions'
import { GrantType, TokenParameters } from '../grants'
import { Endpoint } from './endpoint'

/**
 * Endpoint used by the client to exchange an authorization grant,
 * or its own credentials for an access token that will be used by
 * the client to act on behalf of the Resource Owner.
 */
@Injectable()
export class TokenEndpoint extends Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: SupportedEndpoint = 'token'

  /**
   * Default HTTP headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache'
  }

  /**
   * Instantiates the Token Endpoint.
   *
   * @param grants Grant Type Grants provided by the application.
   * @param clientAuthenticator Client Authenticator instance.
   */
  public constructor(
    @InjectAll('Grant') private readonly grants: GrantType[],
    private readonly clientAuthenticator: ClientAuthenticator
  ) {
    super()
  }

  /**
   * Creates a Token Response via a JSON Response.
   *
   * This endpoint is responsible for issuing Tokens to Clients
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
   * defined by supplementar specifications
   *
   * @param request Current request.
   * @returns Token Response.
   */
  public async handle(request: Request): Promise<Response> {
    const data = <TokenParameters>request.data

    try {
      const client = await this.clientAuthenticator.authenticate(request)
      const grant = this.getGrant(data.grant_type)

      this.checkClientGrantType(client, data.grant_type)

      this.checkResource(data.resource)

      const token = await grant.token(request, client)

      return new JsonResponse(token).setHeaders(this.headers)
    } catch (error) {
      const err =
        error instanceof OAuth2Error
          ? error
          : new ServerError({
              description: GUARANI_ENV === 'development' ? error.message : null
            })

      return new JsonResponse(err)
        .status(err.status_code)
        .setHeaders({ ...err.headers, ...this.headers })
    }
  }

  /**
   * Retrieves the requested Grant based on the **grant_type** parameter.
   *
   * @param grantType Requested Grant Type.
   * @throws {UnsupportedGrantType} The requested grant is unsupported.
   * @returns Grant based on the requested **grant_type**.
   */
  private getGrant(grantType: SupportedGrantType): GrantType {
    const grant = this.grants.find(grant => grant.GRANT_TYPE === grantType)

    if (!grant) {
      throw new UnsupportedGrantType({
        description: `Unsupported grant_type "${grantType}".`
      })
    }

    return grant
  }

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
