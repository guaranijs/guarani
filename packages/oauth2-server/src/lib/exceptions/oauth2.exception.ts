import { removeNullishValues } from '@guarani/primitives';

import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http';

import { ErrorCode } from './error-code.type';
import { OAuth2ExceptionParameters } from './oauth2.exception.parameters';
import { OAuth2ExceptionResponse } from './oauth2.exception.response';

/**
 * Exception Class for the errors that may happen during the authorization process.
 */
export abstract class OAuth2Exception extends Error {
  /**
   * OAuth 2.0 Error Code.
   */
  public abstract readonly code: ErrorCode;

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public readonly statusCode: number = 400;

  /**
   * Http Response Headers of the OAuth 2.0 Exception.
   */
  public readonly headers: OutgoingHttpHeaders = {};

  /**
   * Parameters of the OAuth 2.0 Exception.
   */
  private readonly parameters: OAuth2ExceptionParameters;

  /**
   * Instantiates a new OAuth 2.0 Exception.
   *
   * @param parameters Parameters of the OAuth 2.0 Exception.
   */
  public constructor(parameters: OAuth2ExceptionParameters = {}) {
    super(parameters.description);

    this.parameters = parameters;
  }

  /**
   * Sets a Http Response Header of the OAuth 2.0 Exception.
   *
   * @param header Name of the Http Response Header.
   * @param value Value of the Http Response Header.
   */
  public setHeader(header: string, value: OutgoingHttpHeader): OAuth2Exception {
    this.headers[header] = value;
    return this;
  }

  /**
   * Sets multiple Http Response Headers of the OAuth 2.0 Exception.
   *
   * @param headers Http Response Headers.
   */
  public setHeaders(headers: OutgoingHttpHeaders): OAuth2Exception {
    Object.assign(this.headers, headers);
    return this;
  }

  /**
   * Sets an OAuth 2.0 Exception Parameter.
   *
   * @param parameter Name of the OAuth 2.0 Exception Parameter.
   * @param value Value of the OAuth 2.0 Exception Parameter.
   */
  public setParameter(parameter: keyof OAuth2ExceptionParameters, value: any): OAuth2Exception {
    this.parameters[parameter] = value;
    return this;
  }

  /**
   * Sets multiple OAuth 2.0 Exception Parameters.
   *
   * @param parameters OAuth 2.0 Exception Parameters.
   */
  public setParameters(parameters: OAuth2ExceptionParameters): OAuth2Exception {
    Object.assign(this.parameters, parameters);
    return this;
  }

  /**
   * Body of the OAuth 2.0 Error Response.
   */
  public toJSON(): OAuth2ExceptionResponse {
    return removeNullishValues<OAuth2ExceptionResponse>({
      error: this.code,
      error_description: this.parameters.description,
      error_uri: this.parameters.uri,
      state: this.parameters.state,
      iss: this.parameters.iss,
    });
  }
}
