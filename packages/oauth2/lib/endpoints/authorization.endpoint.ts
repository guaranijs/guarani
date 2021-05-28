import { Inject, Injectable, InjectAll } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { OAuth2Request, OAuth2Response } from '../context'
import {
  AccessDenied,
  InvalidClient,
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnsupportedResponseType
} from '../exceptions'
import { AuthorizationGrant } from '../grants'
import { OAuth2Client, OAuth2User } from '../models'
import { ResponseMode, ResponseModes } from '../response-modes'
import { Endpoint } from './endpoint'

export interface AuthorizationRequest {
  readonly response_type: string
  readonly client_id: string
  readonly redirect_uri: string
  readonly scope: string
  readonly state?: string
  readonly response_mode?: string
}

/**
 * Endpoint used to provide an Authorization Grant for the requesting Client
 * on behalf of the authenticated User.
 *
 * Since the OAuth 2.0 Spec does not define the need for authentication when
 * using this endpoint, it is left omitted.
 */
@Injectable()
export class AuthorizationEndpoint implements Endpoint {
  public readonly name: string = 'authorization'

  public constructor(
    @Inject('Adapter') private readonly adapter: Adapter,
    @InjectAll('Grant') private readonly grants: AuthorizationGrant[]
  ) {}

  /**
   * Creates an **Authorization Response** via a **User-Agent Redirection**.
   *
   * Any error is safely redirected to the **Redirect URI** provided by the
   * Client in the Authorization Request or to the **Provider's Error Endpoint**.
   *
   * If the flow of the endpoint results in a successful response,
   * it will also redirect the User-Agent to the provided Redirect URI.
   *
   * This endpoint is to be used by Grants that have an Authorization Workflow,
   * and it **REQUIRES** consent given by the User, be it implicit or explicit.
   *
   * The means of which the application obtains the consent of the User has
   * to be defined in the Framework Integration, since it usually requires
   * a redirection to an endpoint that is not supported by OAuth 2.0.
   *
   * If this method is hit, it assumes that the User has given consent
   * to whatever scopes were requested by the Client.
   *
   * @param request - Current Request.
   * @returns Redirect Response to the correct URL.
   */
  public async handle(
    request: OAuth2Request<AuthorizationRequest>
  ): Promise<OAuth2Response> {
    const { data } = request

    let user: OAuth2User,
      client: OAuth2Client,
      grant: AuthorizationGrant,
      redirectUri: string,
      responseMode: ResponseMode

    try {
      this.checkRequest(data)

      user = this.getUser(request)
      grant = this.getGrant(data.response_type)
      client = await this.getClient(data.client_id)

      responseMode = this.getResponseMode(
        data.response_mode ?? grant.responseMode
      )

      redirectUri = this.checkClientRedirectUri(client, data)
    } catch (error) {
      return this.handleError(
        'http://localhost:3333/oauth2/error',
        error,
        ResponseModes.query
      )
    }

    try {
      const scopes = this.checkClientScope(client, data)

      const response = await grant.authorize(data, scopes, client, user)

      return responseMode(redirectUri, response)
    } catch (error) {
      return this.handleError(redirectUri, error, responseMode)
    }
  }

  private checkRequest(data: AuthorizationRequest): void {
    const {
      response_type,
      client_id,
      redirect_uri,
      scope,
      response_mode
    } = data

    if (!response_type || typeof response_type !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "response_type".'
      })
    }

    if (!client_id || typeof client_id !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "client_id".'
      })
    }

    if (!redirect_uri || typeof redirect_uri !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "redirect_uri".'
      })
    }

    if (!scope || typeof scope !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "scope".'
      })
    }

    if (response_mode && typeof response_mode !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "response_mode".'
      })
    }
  }

  /**
   * Fetches the User from the Request if it has given consent, otherwise,
   * denies access to the Client.
   *
   * @param request - Current Request.
   * @returns Object representing the User of the Request.
   */
  private getUser(request: OAuth2Request<AuthorizationRequest>): OAuth2User {
    const { user } = request

    if (!user) {
      throw new AccessDenied({
        description: 'Authorization denied by the user.'
      })
    }

    return user
  }

  /**
   * Retrieves the requested Grant based on the `response_type` parameter.
   *
   * @param responseType - Requested Response Type.
   * @throws {UnsupportedResponseType} The requested grant is unsupported.
   * @returns Grant based on the requested `response_type`.
   */
  private getGrant(responseType: string): AuthorizationGrant {
    const grant = this.grants.find(grant => grant.responseType === responseType)

    if (!grant) {
      throw new UnsupportedResponseType({
        description: `Unsupported response_type "${responseType}".`
      })
    }

    return grant
  }

  /**
   * Fetches a Client from the application's storage based on the provided ID.
   *
   * @param clientId - ID of the Client of the Request.
   * @returns Object representing the current Client.
   */
  private async getClient(clientId: string): Promise<OAuth2Client> {
    const client = await this.adapter.findClient(clientId)

    if (!client) {
      throw new InvalidClient({ description: 'Invalid Client.' })
    }

    return client
  }

  private getResponseMode(response_mode: string): ResponseMode {
    const responseMode = ResponseModes[response_mode]

    if (!responseMode)
      throw new InvalidRequest({
        description: `Unsupported response_mode "${response_mode}".`
      })

    return responseMode
  }

  private checkClientRedirectUri(
    client: OAuth2Client,
    data: AuthorizationRequest
  ): string {
    const redirectUri = data.redirect_uri

    if (!client.checkRedirectUri(redirectUri)) {
      throw new AccessDenied({ description: 'Invalid Redirect URI.' })
    }

    return redirectUri
  }

  private checkClientScope(
    client: OAuth2Client,
    data: AuthorizationRequest
  ): string[] {
    const scopes = client.checkScope(data.scope)

    if (!scopes) {
      throw new AccessDenied({
        description: 'This Client is not allowed to request this scope.',
        state: data.state
      })
    }

    return scopes
  }

  private handleError(
    redirectUri: string,
    error: Error,
    responseMode: ResponseMode
  ): OAuth2Response {
    const err =
      error instanceof OAuth2Error
        ? error
        : new ServerError({ description: error.message })

    return responseMode(redirectUri, err.data)
  }
}
