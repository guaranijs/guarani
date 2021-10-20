import { Inject, Injectable, InjectAll } from '@guarani/ioc'

import { URL } from 'url'

import { Adapter } from '../adapter'
import {
  SupportedEndpoint,
  SupportedResponseMode,
  SupportedResponseType
} from '../constants'
import { RedirectResponse, Request, Response } from '../context'
import { Client, User } from '../entities'
import {
  AccessDenied,
  InvalidClient,
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnauthorizedClient,
  UnsupportedResponseType
} from '../exceptions'
import { AuthorizationParameters, ResponseType } from '../grants'
import { ResponseMode } from '../response-modes'
import { Settings } from '../settings'
import { Endpoint } from './endpoint'

/**
 * Endpoint used to provide an Authorization Grant for the requesting Client
 * on behalf of the authenticated User.
 *
 * Since the OAuth 2.0 Spec does not define the need for authentication when
 * using this endpoint, it is left omitted.
 */
@Injectable()
export class AuthorizationEndpoint extends Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name = SupportedEndpoint.Authorization

  /**
   * Instantiates the Authorization Endpoint.
   *
   * @param adapter Adapter provided by the application.
   * @param grants **Response Type** Grants provided by the application.
   * @param responseModes Response Modes provided by the application.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    @Inject('Adapter') private readonly adapter: Adapter,
    @InjectAll('Grant') private readonly grants: ResponseType[],
    @InjectAll('ResponseMode') private readonly responseModes: ResponseMode[],
    private readonly settings: Settings
  ) {
    super()
  }

  /**
   * URL of the OAuth 2.0 Error Page.
   */
  private get errorUrl(): string {
    const { errorUrl, issuer } = this.settings
    return new URL(errorUrl, issuer).href
  }

  /**
   * Creates an **Authorization Response** via a **User-Agent Redirection**.
   *
   * Any error is safely redirected to the **Redirect URI** provided by the
   * Client in the Authorization Request or the **Provider's Error Endpoint**.
   *
   * If the authorization flow of the grant results in a successful response,
   * it will also redirect the User-Agent to the provided Redirect URI.
   *
   * This method is to be used by Grants that have an Authorization Workflow,
   * and it **REQUIRES** consent given by the User, be it implicit or explicit.
   *
   * The means of which the application obtains the consent of the User has
   * to be defined in the Framework Integration, since it usually requires
   * a redirection to an endpoint that is not supported by OAuth 2.0.
   *
   * If this method is hit, it assumes that the User has given consent
   * to whatever scopes were requested by the Client.
   *
   * @param request Current Request.
   * @returns Authorization Response.
   */
  public async handle(request: Request): Promise<Response> {
    const data = <AuthorizationParameters>request.data

    let client: Client,
      grant: ResponseType,
      redirectUri: string,
      responseMode: ResponseMode

    try {
      this.checkParameters(data)

      client = await this.getClient(data.client_id)
      grant = this.getGrant(data.response_type)

      this.checkClientResponseType(client, data.response_type)

      redirectUri = this.checkClientRedirectUri(client, data.redirect_uri)

      this.checkResource(data.resource)
    } catch (error) {
      return this.handleAuthorizationError(this.errorUrl, error)
    }

    try {
      const user = this.getUser(request)

      responseMode = this.getResponseMode(
        data.response_mode || grant.DEFAULT_RESPONSE_MODE
      )

      const response = await grant.authorize(request, client, user)

      return responseMode.createResponse(redirectUri, response)
    } catch (error) {
      return this.handleAuthorizationError(redirectUri, error, responseMode)
    }
  }

  /**
   * Checks the parameters of the Authorization Request.
   *
   * @param data Parameters of the Authorization Request.
   * @throws {InvalidRequest} One or more authorization parameters are invalid.
   */
  protected checkParameters(data: AuthorizationParameters): void {
    const { response_type, client_id, redirect_uri, scope } = data

    if (!response_type) {
      throw new InvalidRequest('Invalid parameter "response_type".')
    }

    if (!client_id) {
      throw new InvalidRequest('Invalid parameter "client_id".')
    }

    if (!redirect_uri) {
      throw new InvalidRequest('Invalid parameter "redirect_uri".')
    }

    if (!scope) {
      throw new InvalidRequest('Invalid parameter "scope".')
    }
  }

  /**
   * Fetches a Client from the application's storage based on the provided ID.
   *
   * @param clientId ID of the Client of the Request.
   * @throws {InvalidClient} The Client is not valid.
   * @returns Object representing the current Client.
   */
  private async getClient(clientId: string): Promise<Client> {
    const client = await this.adapter.findClient(clientId)

    if (!client) {
      throw new InvalidClient('Invalid Client.')
    }

    return client
  }

  /**
   * Retrieves the requested Grant based on the **response_type** parameter.
   *
   * @param responseType Requested Response Type.
   * @throws {UnsupportedResponseType} The requested grant is unsupported.
   * @returns Grant based on the requested **response_type**.
   */
  private getGrant(responseType: SupportedResponseType): ResponseType {
    // Alphabetic sorting of the Response Types.
    responseType = <SupportedResponseType>(
      responseType.split(' ').sort().join(' ')
    )

    const grant = this.grants.find(grant =>
      (grant.RESPONSE_TYPES ?? []).includes(responseType)
    )

    if (!grant) {
      throw new UnsupportedResponseType(
        `Unsupported response_type "${responseType}".`
      )
    }

    return grant
  }

  /**
   * Checks if the Client is allowed to use the requested Response Type.
   *
   * @param client Client requesting authorization.
   * @param responseType Response Type requested by the Client.
   * @throws {UnauthorizedClient} The Client is not allowed to use
   *   the requested Response Type.
   */
  private checkClientResponseType(
    client: Client,
    responseType: SupportedResponseType
  ): void {
    // Alphabetic sorting of the Response Types.
    responseType = <SupportedResponseType>(
      responseType.split(' ').sort().join(' ')
    )

    if (!client.checkResponseType(responseType)) {
      throw new UnauthorizedClient(
        'This Client is not allowed to request ' +
          `the response_type "${responseType}".`
      )
    }
  }

  /**
   * Checks the provided Redirect URI against the registered
   * Redirect URIs of the Client.
   *
   * @param client Client requesting authorization.
   * @param redirectUri Redirect URI provided by the Client.
   * @throws {AccessDenied} The Client is not allowed to use the Redirect URI.
   * @returns Redirect URI provided by the Client.
   */
  private checkClientRedirectUri(client: Client, redirectUri: string): string {
    if (!client.checkRedirectUri(redirectUri)) {
      throw new AccessDenied('Invalid Redirect URI.')
    }

    return redirectUri
  }

  /**
   * Fetches the User from the Request if it has given consent, otherwise,
   * denies access to the Client.
   *
   * @param request Current Request.
   * @throws {AccessDenied} The User did not authorize the Request.
   * @returns Object representing the User of the Request.
   */
  private getUser(request: Request): User {
    const { user } = request

    if (!user) {
      throw new AccessDenied('Authorization denied by the user.')
    }

    return user
  }

  /**
   * Retrieves the requested Response Mode based on the
   * **response_mode** parameter.
   *
   * @param responseMode Requested Response Mode.
   * @throws {InvalidRequest} The requested Response Mode is unsupported.
   * @returns Response Mode based on the requested **response_mode**.
   */
  private getResponseMode(responseMode: SupportedResponseMode): ResponseMode {
    const mode = this.responseModes.find(mode => mode.name === responseMode)

    if (!mode) {
      throw new InvalidRequest(`Unsupported response_mode "${responseMode}".`)
    }

    return mode
  }

  /**
   * Handles the Authorization Errors that may arise in the
   * Authorization process.
   *
   * @param redirectUri Redirect URI used by the Redirect Response.
   * @param error Error thrown by the Endpoint.
   * @param responseMode Response Mode used to generate the Redirect Response.
   * @returns Authorization Error Response.
   */
  private handleAuthorizationError(
    redirectUri: string,
    error: Error,
    responseMode?: ResponseMode
  ): Response {
    const err =
      error instanceof OAuth2Error ? error : new ServerError(error.message)

    try {
      responseMode ??= this.getResponseMode(SupportedResponseMode.Query)
    } catch {
      return this.defaultAuthorizationError(err)
    }

    return responseMode.createResponse(redirectUri, err.toJSON())
  }

  /**
   * Fallback method for when a Fatal Error was raised and the Response Mode
   * **query** is not supported by the Provider.
   *
   * @param error Error raised during the Authorization Flow.
   * @returns Redirect Response to the Provider's Error page.
   */
  private defaultAuthorizationError(error: OAuth2Error): RedirectResponse {
    const url = new URL(this.errorUrl)

    Object.entries(error.toJSON()).forEach(([name, value]) =>
      url.searchParams.set(name, value)
    )

    return new RedirectResponse(url.href)
  }
}
