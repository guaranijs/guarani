import { Dict } from '@guarani/utils'

import { SupportedResponseMode, SupportedResponseType } from '../constants'
import { Request } from '../context'
import { Client, User } from '../entities'

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
  readonly redirect_uri?: string

  /**
   * Scope requested by the Client.
   */
  readonly scope?: string

  /**
   * State of the Client Application prior to the Authorization Request.
   */
  readonly state?: string

  /**
   * Response Mode requested by the Client to return the Authorization Response.
   */
  readonly response_mode?: SupportedResponseMode
}

/**
 * Interface of the Authorization Flow of the OAuth 2.0 Grants.
 */
export interface ResponseType {
  /**
   * Names of the Grant's Response Types.
   */
  readonly responseTypes: SupportedResponseType[]

  /**
   * Default Response Mode of the Grant.
   */
  readonly defaultResponseMode: SupportedResponseMode

  /**
   * Implementation of the Grant's Authorization Flow.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @param user User that granted authorization.
   * @returns Dictionary with the parameters of the Authorization Response.
   */
  authorize(request: Request, client: Client, user: User): Promise<Dict>
}