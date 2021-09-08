import { removeNullishValues } from '@guarani/utils'

import { OutgoingHttpHeaders } from 'http'

/**
 * Parameters accepted by the Error Response.
 */
interface ErrorParams {
  /**
   * Optional headers of the Error Response.
   */
  readonly headers?: OutgoingHttpHeaders

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
  public readonly headers?: OutgoingHttpHeaders

  /**
   * Defines the status code of the Error Response.
   */
  public readonly status_code: number = 400

  /**
   * Code of the error.
   */
  public readonly error: string

  /**
   * Description of the error.
   */
  public readonly error_description?: string

  /**
   * URI that describes the error.
   */
  public error_uri?: string

  /**
   * State of the Client provided in the Request.
   */
  public state?: string

  /**
   * Instantiates a new Error Response based on the provided parameters.
   *
   * @param params Parameters of the Error Response.
   */
  public constructor(params: ErrorParams = {}) {
    super(params.description)

    this.name = this.constructor.name

    this.headers = params.headers

    if (params.status_code) {
      this.status_code = params.status_code
    }

    this.error_description = params.description

    this.error_uri = params.uri

    this.state = params.state
  }

  public toJSON() {
    return removeNullishValues({
      error: this.error,
      error_description: this.error_description,
      error_uri: this.error_uri,
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

export class InvalidTarget extends OAuth2Error {
  public readonly error: string = 'invalid_target'
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
