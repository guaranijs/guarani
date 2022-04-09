import { Dict, Optional } from '@guarani/types';

import { OAuth2ExceptionParams } from './oauth2.exception.params';
import { SupportedOAuth2Error } from './types/supported-oauth2-errors';

/**
 * Errors that can happen during the authorization process.
 */
export class OAuth2Exception extends Error {
  /**
   * Parameters of the OAuth 2.0 Exception.
   */
  private data: OAuth2ExceptionParams;

  /**
   * Instantiates a new OAuth 2.0 Exception.
   *
   * @param error OAuth 2.0 Error Code.
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  private constructor(error: SupportedOAuth2Error, params: Dict = {}) {
    let message = <string>error;

    if (params.description !== undefined) {
      message = `"${message}": ${params.description}`;
    }

    super(message);

    this.data = { ...params, error };
  }

  /**
   * Parameters of the OAuth 2.0 Exception.
   */
  public toJSON(): OAuth2ExceptionParams {
    return this.data;
  }

  /**
   * Raised when the User did not authorize the Client.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static AccessDenied(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('access_denied', params);
  }

  /**
   * Raised when the Client Authentication failed.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static InvalidClient(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('invalid_client', params);
  }

  /**
   * Raised when the provided authorization grant is invalid.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static InvalidGrant(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('invalid_grant', params);
  }

  /**
   * Raised when the OAuth 2.0 Request is invalid.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static InvalidRequest(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('invalid_request', params);
  }

  /**
   * Raised when the requested scope is invalid.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static InvalidScope(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('invalid_scope', params);
  }

  /**
   * Raised when the server encountered an unexpected error.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static ServerError(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('server_error', params);
  }

  /**
   * Raised when the server is temporarily unavailable.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static TemporarilyUnavailable(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('temporarily_unavailable', params);
  }

  /**
   * Raised when the Client is not authorized to use the requested Grant.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static UnauthorizedClient(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('unauthorized_client', params);
  }

  /**
   * Raised when the requested **grant_type** is not supported by Guarani.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static UnsupportedGrantType(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('unsupported_grant_type', params);
  }

  /**
   * Raised when the requested **response_type** is not supported by Guarani.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public static UnsupportedResponseType(params?: Optional<Dict>): OAuth2Exception {
    return new OAuth2Exception('unsupported_response_type', params);
  }
}
