import { Dict, removeNullishValues } from '@guarani/utils'

import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http'
import { URL, URLSearchParams } from 'url'

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
export class OAuth2Error extends Error {
  /**
   * Status code of the Error Response.
   */
  private _statusCode: number = 400

  /**
   * Headers of the Error Response.
   */
  private _headers: OutgoingHttpHeaders = {}

  /**
   * Data of the Error Response.
   */
  private readonly data: ErrorParams

  /**
   * Status Code of the Error Response.
   */
  public get statusCode(): number {
    return this._statusCode
  }

  /**
   * Headers of the Error Response.
   */
  public get headers(): OutgoingHttpHeaders {
    return this._headers
  }

  /**
   * Instantiates a new Error Response based on the provided parameters.
   *
   * @param error OAuth 2.0 Error Code.
   * @param description Description of the OAuth 2.0 Error.
   */
  private constructor(error: string, description: string) {
    super()

    this.data = { error, error_description: description }
  }

  /**
   * Sets a new HTTP Status Code for the Response.
   *
   * @param statusCode HTTP Status Code.
   */
  public status(statusCode: number): OAuth2Error {
    this._statusCode = statusCode
    return this
  }

  /**
   * Sets an HTTP Header on the Error Response.
   *
   * @param name Name of the HTTP Header.
   * @param value Value of the HTTP Header.
   */
  public setHeader(name: string, value: OutgoingHttpHeader): OAuth2Error {
    this._headers[name] = value
    return this
  }

  /**
   * Sets multiple HTTP Headers on the Error Response.
   *
   * @param values Dictionary of the HTTP Headers.
   */
  public setHeaders(values: OutgoingHttpHeaders): OAuth2Error {
    Object.assign(this._headers, values)
    return this
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
   * Returns the Data of the Error Response.
   */
  public toJSON(): ErrorParams {
    return removeNullishValues(this.data)
  }

  /**
   * Formats the Redirect URI with the Data of the OAuth 2.0 Error.
   *
   * @param uri Base Redirect URI.
   * @param fragment Informs whether or not to put the Data in the fragment.
   * @returns Redirect URI populated with the Error's Data.
   */
  public getRedirectUri(uri: string, fragment: boolean = false): string {
    const url = new URL(uri)
    const params = new URLSearchParams(<Dict>this.toJSON())

    if (fragment === true) {
      url.hash = String(params)
    } else {
      url.search = String(params)
    }

    return url.href
  }

  public static AccessDenied(description?: string): OAuth2Error {
    return new OAuth2Error('access_denied', description)
  }

  public static InvalidClient(description?: string): OAuth2Error {
    return new OAuth2Error('invalid_client', description).status(401)
  }

  public static InvalidGrant(description?: string): OAuth2Error {
    return new OAuth2Error('invalid_grant', description)
  }

  public static InvalidRequest(description?: string): OAuth2Error {
    return new OAuth2Error('invalid_request', description)
  }

  public static InvalidScope(description?: string): OAuth2Error {
    return new OAuth2Error('invalid_scope', description)
  }

  public static InvalidTarget(description?: string): OAuth2Error {
    return new OAuth2Error('invalid_target', description)
  }

  public static ServerError(description?: string): OAuth2Error {
    return new OAuth2Error('serverError', description).status(500)
  }

  public static TemporarilyUnavailable(description?: string): OAuth2Error {
    return new OAuth2Error('temporarily_unavailable', description).status(503)
  }

  public static UnauthorizedClient(description?: string): OAuth2Error {
    return new OAuth2Error('unauthorized_client', description)
  }

  public static UnsupportedGrantType(description?: string): OAuth2Error {
    return new OAuth2Error('unsupported_grant_type', description)
  }

  public static UnsupportedResponseType(description?: string): OAuth2Error {
    return new OAuth2Error('unsupported_response_type', description)
  }

  public static UnsupportedTokenType(description?: string): OAuth2Error {
    return new OAuth2Error('unsupported_token_type', description)
  }
}
