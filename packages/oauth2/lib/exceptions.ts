/* eslint-disable camelcase */

import { Objects } from '@guarani/utils'

/**
 * Parameters accepted by the Error Response.
 */
export interface ErrorParams {
  /**
   * Optional headers of the Error Response.
   */
  readonly headers?: Record<string, any>

  /**
   * Defines the status code of the Error Response.
   */
  readonly status_code?: number

  /**
   * URI used to redirect the User-Agent based on the error.
   */
  readonly redirect_uri?: string

  /**
   * Description of the error.
   */
  readonly description?: string

  /**
   * URI that describes the error.
   */
  readonly uri?: string

  /**
   * State of the Client provided in the Request.
   */
  readonly state?: string
}

/**
 * Parameters of the formatted Error Response.
 */
export interface ErrorResponse {
  /**
   * Code of the error.
   */
  readonly error?: string

  /**
   * Description of the error.
   */
  readonly error_description?: string

  /**
   * URI that describes the error.
   */
  readonly error_uri?: string

  /**
   * State of the Client provided in the Request.
   */
  readonly state?: string
}

/**
 * Representation of the errors that can occur during the authorization process.
 *
 * This is a base class that provides the main attributes defined by
 * {@link https://tools.ietf.org/html/rfc6749|RFC 6749} which are:
 *
 * * `error`: Denotes the code of the error.
 * * `error_description`: Human readable description with the details of the error.
 * * `error_uri`: URI containing more information about the error.
 * * `state`: String representing the state of the Client before the request.
 */
export class OAuth2Error extends Error {
  /**
   * Optional headers of the Error Response.
   */
  public readonly headers?: Record<string, any>

  /**
   * Defines the status code of the Error Response.
   */
  public readonly status_code: number

  /**
   * URI used to redirect the User-Agent based on the error.
   */
  public readonly redirect_uri?: string

  /**
   * Code of the error.
   */
  public readonly error: string

  /**
   * Description of the error.
   */
  protected readonly description?: string

  /**
   * URI that describes the error.
   */
  protected readonly uri?: string

  /**
   * State of the Client provided in the Request.
   */
  protected readonly state?: string

  /**
   * Instantiates a new Error Response based on the provided parameters.
   *
   * @param params - Parameters of the Error Response.
   */
  public constructor(params: ErrorParams = {}) {
    super(params.description)

    this.name = this.constructor.name

    this.headers = params.headers ?? {}

    if (params.status_code) this.status_code = params.status_code

    this.description = params.description

    this.uri = params.uri

    this.state = params.state
  }

  /**
   * Formatted data of the Error Response.
   */
  public get data(): ErrorResponse {
    return Objects.removeNullishValues<ErrorResponse>({
      error: this.error,
      error_description: this.description,
      error_uri: this.uri,
      state: this.state
    })
  }
}

export class AccessDenied extends OAuth2Error {
  public readonly error: string = 'access_denied'
}

export class InvalidClient extends OAuth2Error {
  public readonly status_code: number = 401
  public readonly error: string = 'invalid_client'
}

export class InvalidGrant extends OAuth2Error {
  public readonly error: string = 'invalid_grant'
}

export class InvalidRequest extends OAuth2Error {
  public readonly error: string = 'invalid_request'
}

export class InvalidScope extends OAuth2Error {
  public readonly error: string = 'invalid_scope'
}

export class ServerError extends OAuth2Error {
  public readonly status_code: number = 500
  public readonly error: string = 'server_error'
}

export class TemporarilyUnavailable extends OAuth2Error {
  public readonly status_code: number = 503
  public readonly error: string = 'temporarily_unavailable'
}

export class UnauthorizedClient extends OAuth2Error {
  public readonly error: string = 'unauthorized_client'
}

export class UnsupportedGrantType extends OAuth2Error {
  public readonly error: string = 'unsupported_grant_type'
}

export class UnsupportedResponseType extends OAuth2Error {
  public readonly error: string = 'unsupported_response_type'
}

export class UnsupportedTokenType extends OAuth2Error {
  public readonly error: string = 'unsupported_token_type'
}
