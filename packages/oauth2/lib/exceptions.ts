import { Dict, removeNullishValues } from '@guarani/utils'

import { OutgoingHttpHeaders } from 'http'
import { URL, URLSearchParams } from 'url'

/**
 * Interface of the Http Parameters of the Error Response.
 */
interface HttpParams {
  /**
   * Status Code of the Error Response.
   */
  readonly status?: number

  /**
   * Http Headers of the Error Response.
   */
  readonly headers?: OutgoingHttpHeaders
}

/**
 * Interface of the parameters of the Error Response.
 */
interface ErrorParams {
  /**
   * Code of the error.
   */
  readonly error: string

  /**
   * Description of the error.
   */
  readonly error_description?: string

  /**
   * URI that describes the error.
   */
  error_uri?: string

  /**
   * State of the Client provided in the Request.
   */
  state?: string
}

/**
 * Representation of the errors that can occur during the authorization process.
 *
 * This is a base class that provides the main attributes defined by
 * {@link https://tools.ietf.org/html/rfc6749 RFC 6749} which are:
 *
 * * `error`: Denotes the code of the error.
 * * `error_description`: Human readable description with the details of the error.
 * * `error_uri`: URI containing more information about the error.
 * * `state`: String representing the state of the Client before the request.
 */
export abstract class OAuth2Error extends Error {
  /**
   * Status code of the Error Response.
   */
  public readonly status: number

  /**
   * Headers of the Error Response.
   */
  public readonly headers: OutgoingHttpHeaders

  /**
   * Code of the Error.
   */
  public readonly error: string

  /**
   * Data of the Error Response.
   */
  private readonly data: ErrorParams

  /**
   * Instantiates a new Error Response based on the provided parameters.
   *
   * @param description Description of the OAuth 2.0 Error.
   * @param httpParams Http Parameters of the OAuth 2.0 Error.
   */
  public constructor(description?: string, httpParams: HttpParams = {}) {
    super(description)

    this.name = this.constructor.name

    this.status = httpParams.status ?? 400
    this.headers = httpParams.headers ?? {}

    this.data = { error: this.error, error_description: description }
  }

  /**
   * Sets the URI of the Error Response.
   *
   * @param uri URI with the documentation of the Error.
   */
  public setErrorUri(uri: string): OAuth2Error {
    this.data.error_uri = uri
    return this
  }

  /**
   * Sets the State of the Error Response.
   *
   * @param state State of the Client provided in the Request.
   */
  public setState(state: string): OAuth2Error {
    this.data.state = state
    return this
  }

  /**
   * Sets a custom parameter of the Error Response.
   *
   * @param name Name of the Parameter.
   * @param value Value of the Parameter.
   */
  public setDataParam(name: string, value: unknown): OAuth2Error {
    this.data[name] = value
    return this
  }

  /**
   * Returns the Data of the Error Response.
   */
  public toJSON(): ErrorParams {
    Object.defineProperty(this.data, 'error', { value: this.error })

    return removeNullishValues(this.data)
  }

  /**
   * Formats the Redirect URI with the Data of the OAuth 2.0 Error.
   *
   * @param baseUrl Base Redirect URI.
   * @param fragment Informs whether or not to put the Data in the fragment.
   * @returns Redirect URI populated with the Error's Data.
   */
  public getRedirectUri(baseUrl: URL, fragment: boolean = false): URL {
    const params = new URLSearchParams(<Dict>this.toJSON())

    if (fragment === true) {
      baseUrl.hash = String(params)
    } else {
      baseUrl.search = String(params)
    }

    return baseUrl
  }
}

/**
 * The Resource Owner or Authorization Server denied the request.
 */
export class AccessDenied extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'access_denied'
}

/**
 * The Client failed to authenticate with the Authorization Server.
 */
export class InvalidClient extends OAuth2Error {
  /**
   * Status code of the Error Response.
   */
  public readonly status: number = 401

  /**
   * Code of the Error.
   */
  public readonly error: string = 'invalid_client'
}

/**
 * The provided grant is invalid or does not pertain to the Client.
 */
export class InvalidGrant extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'invalid_grant'
}

/**
 * One or more parameters of the Request is invalid or otherwise malformed.
 */
export class InvalidRequest extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'invalid_request'
}

/**
 * The requested Scope is invalid, unsupported or was not granted
 * by the Resource Owner.
 */
export class InvalidScope extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'invalid_scope'
}

/**
 * The requested resource is invalid, missing, unknown, or malformed.
 */
export class InvalidTarget extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'invalid_target'
}

/**
 * An error not supported by OAuth 2.0 occurred at the Authorization Server.
 */
export class ServerError extends OAuth2Error {
  /**
   * Status code of the Error Response.
   */
  public readonly status: number = 500

  /**
   * Code of the Error.
   */
  public readonly error: string = 'server_error'
}

/**
 * The Authorization Server is Temporarily Unavailable.
 */
export class TemporarilyUnavailable extends OAuth2Error {
  /**
   * Status code of the Error Response.
   */
  public readonly status: number = 503

  /**
   * Code of the Error.
   */
  public readonly error: string = 'temporarily_unavailable'
}

/**
 * The Authenticated Client is not allowed to use the requested Grant.
 */
export class UnauthorizedClient extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'unauthorized_client'
}

/**
 * The requested Grant Type is not supported by the Authorization Server.
 */
export class UnsupportedGrantType extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'unsupported_grant_type'
}

/**
 * The requested Response Type is not supported by the Authorization Server.
 */
export class UnsupportedResponseType extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'unsupported_response_type'
}

/**
 * The operation at the provided Token Type is not supported
 * by the Authorization Server.
 */
export class UnsupportedTokenType extends OAuth2Error {
  /**
   * Code of the Error.
   */
  public readonly error: string = 'unsupported_token_type'
}
