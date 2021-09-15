import { getContainer, Injectable } from '@guarani/ioc'
import { Dict, OneOrMany } from '@guarani/utils'

import { URL } from 'url'

import {
  GUARANI_ENV,
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
import { ResponseMode } from '../response-modes'
import { Settings } from '../settings'
import { Grant } from './grant'

/**
 * Defines the default parameters of the Authorization Request.
 */
export interface AuthorizationParameters {
  /**
   * Response Type requested by the Client.
   */
  readonly response_type: SupportedResponseType

  /**
   * ID of the Client requesting authorization.
   */
  readonly client_id: string

  /**
   * Redirect URI of the Client.
   */
  readonly redirect_uri: string

  /**
   * Scope requested by the Client.
   */
  readonly scope: string

  /**
   * State of the Client Application prior to the Authorization Request.
   */
  readonly state?: string

  /**
   * Response Mode requested by the Client to return the Authorization Response.
   */
  readonly response_mode?: SupportedResponseMode

  /**
   * Resource requested by the Client.
   */
  readonly resource?: OneOrMany<string>
}

/**
 * Defines the parameters to be displayed at the User Consent process.
 */
export interface UserConsent {
  /**
   * Client requesting authorization.
   */
  readonly client: Client

  /**
   * Scopes requested by the Client.
   */
  readonly scopes: string[]
}

/**
 * Interface of the Authorization Flow of the OAuth 2.0 Grants.
 */
@Injectable()
export abstract class ResponseType extends Grant {
  /**
   * Response Modes provided by the application.
   */
  private static get RESPONSE_MODES(): ResponseMode[] {
    return getContainer('oauth2').resolveAll<ResponseMode>('ResponseMode')
  }

  /**
   * Names of the Grant's Response Types.
   */
  public abstract readonly RESPONSE_TYPES: SupportedResponseType[]

  /**
   * Default Response Mode of the Grant.
   */
  public abstract readonly DEFAULT_RESPONSE_MODE: SupportedResponseMode

  /**
   * URL of the OAuth 2.0 Error Page.
   */
  private static get errorUrl(): string {
    const { errorUrl, issuer } = getContainer('oauth2').resolve(Settings)
    return new URL(errorUrl, issuer).href
  }

  /**
   * Fetches the parameters of the User Consent from the Authorization Request.
   *
   * @param request Current Request.
   * @returns User Consent parameters.
   */
  public static async getUserConsent(request: Request): Promise<UserConsent> {
    const data = <AuthorizationParameters>request.data

    try {
      const grant = this.getResponseType(data.response_type)

      grant.checkAuthorizationParameters(data)
      grant.emit('user_consent', data)

      const client = await grant.getAuthorizationClient(data.client_id)

      grant.checkClientResponseType(client, data.response_type)
      grant.checkClientRedirectUri(client, data.redirect_uri)

      const scopes = await grant.adapter.checkClientScope(client, data.scope)

      return { client, scopes }
    } catch (error) {
      throw error instanceof OAuth2Error
        ? error
        : new ServerError({
            description: GUARANI_ENV === 'development' ? error.message : null
          })
    }
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
  public static async createAuthorizationResponse(
    request: Request
  ): Promise<Response> {
    const data = <AuthorizationParameters>request.data

    try {
      const grant = this.getResponseType(data.response_type)
      return await grant.handleAuthorization(request)
    } catch (error) {
      return this.defaultAuthorizationError(error)
    }
  }

  /**
   * Retrieves the requested Grant based on the **response_type** parameter.
   *
   * @param responseType Requested Response Type.
   * @throws {UnsupportedResponseType} The requested grant is unsupported.
   * @returns Grant based on the requested **response_type**.
   */
  private static getResponseType(
    responseType: SupportedResponseType
  ): ResponseType {
    if (!responseType) {
      throw new InvalidRequest({
        description: 'Invalid parameter "response_type".'
      })
    }

    // Alphabetic sorting of the Response Types.
    responseType = <SupportedResponseType>(
      responseType.split(' ').sort().join(' ')
    )

    const grants = getContainer('oauth2').resolveAll<ResponseType>('Grant')
    const grant = grants.find(grant =>
      (grant.RESPONSE_TYPES ?? []).includes(responseType)
    )

    if (!grant) {
      throw new UnsupportedResponseType({
        description: `Unsupported response_type "${responseType}".`
      })
    }

    return grant
  }

  /**
   * Implementation of the Grant's Authorization Flow.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @param user User that granted authorization.
   * @returns Dictionary with the parameters of the Authorization Response.
   */
  protected abstract authorize(
    request: Request,
    client: Client,
    user: User
  ): Promise<Dict>

  /**
   * Handles the Authorization Workflow of the Grant
   * based on the following steps:
   *
   * * Checks the Parameters of the Authorization Request.
   * * Fetches the Client.
   * * Checks the data of the Client against the Authorization Request.
   * * Fetches the Authenticated User of the Authorization Request.
   * * Fetches the requested Response Mode or uses the fallback.
   * * Invokes the `authorize()` method to generate the Authorization Response.
   * * Redirects the User-Agent with the Authorization Response.
   *
   * @param request Current Request.
   * @returns Authorization Response.
   */
  private async handleAuthorization(request: Request): Promise<Response> {
    const data = <AuthorizationParameters>request.data

    let client: Client, redirectUri: string, responseMode: ResponseMode

    try {
      this.checkAuthorizationParameters(data)
      this.emit('authorization_request', data)

      client = await this.getAuthorizationClient(data.client_id)

      this.checkClientResponseType(client, data.response_type)

      redirectUri = this.checkClientRedirectUri(client, data.redirect_uri)

      this.checkResource(data.resource)
    } catch (error) {
      return this.handleAuthorizationError(ResponseType.errorUrl, error)
    }

    try {
      const user = this.getAuthorizationUser(request)

      responseMode = this.getResponseMode(
        data.response_mode || this.DEFAULT_RESPONSE_MODE
      )

      const response = await this.authorize(request, client, user)

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
  protected checkAuthorizationParameters(data: AuthorizationParameters): void {
    const { client_id, redirect_uri, scope } = data

    if (!client_id) {
      throw new InvalidRequest({
        description: 'Invalid parameter "client_id".'
      })
    }

    if (!redirect_uri) {
      throw new InvalidRequest({
        description: 'Invalid parameter "redirect_uri".'
      })
    }

    if (!scope) {
      throw new InvalidRequest({ description: 'Invalid parameter "scope".' })
    }
  }

  /**
   * Fetches a Client from the application's storage based on the provided ID.
   *
   * @param clientId ID of the Client of the Request.
   * @throws {InvalidClient} The Client is not valid.
   * @returns Object representing the current Client.
   */
  private async getAuthorizationClient(clientId: string): Promise<Client> {
    const client = await this.adapter.findClient(clientId)

    if (!client) {
      throw new InvalidClient({ description: 'Invalid Client.' })
    }

    return client
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
    if (!client.checkResponseType(responseType)) {
      throw new UnauthorizedClient({
        description:
          'This Client is not allowed to request ' +
          `the response_type "${responseType}".`
      })
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
      throw new AccessDenied({ description: 'Invalid Redirect URI.' })
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
  private getAuthorizationUser(request: Request): User {
    const { user } = request

    if (!user) {
      throw new AccessDenied({
        description: 'Authorization denied by the user.'
      })
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
    const constructor = <typeof ResponseType>this.constructor

    const mode = constructor.RESPONSE_MODES.find(
      mode => mode.name === responseMode
    )

    if (!mode) {
      throw new InvalidRequest({
        description: `Unsupported response_mode "${responseMode}".`
      })
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
      error instanceof OAuth2Error
        ? error
        : new ServerError({
            description: GUARANI_ENV === 'development' ? error.message : null
          })

    try {
      responseMode ??= this.getResponseMode('query')
    } catch {
      return ResponseType.defaultAuthorizationError(err)
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
  private static defaultAuthorizationError(
    error: OAuth2Error
  ): RedirectResponse {
    const url = new URL(this.errorUrl)

    Object.entries(error.toJSON()).forEach(([name, value]) =>
      url.searchParams.set(name, value)
    )

    return new RedirectResponse(url.href)
  }
}
