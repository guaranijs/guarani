import { removeNullishValues } from '@guarani/objects';
import { Optional } from '@guarani/types';

import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http';

import { ErrorResponse } from '../models/error-response';
import { ErrorCode } from '../types/error-code';

/**
 * Abstract Base Class for the errors that may happen during the authorization process.
 */
export abstract class OAuth2Exception extends Error {
  /**
   * OAuth 2.0 Error Code.
   */
  public abstract readonly errorCode: ErrorCode;

  /**
   * HTTP Response Status Code of the OAuth 2.0 Exception.
   */
  public readonly statusCode: number = 400;

  /**
   * HTTP Response Headers of the OAuth 2.0 Exception.
   */
  public readonly headers: OutgoingHttpHeaders = {};

  /**
   * Parameters of the OAuth 2.0 Exception.
   */
  private data: Omit<ErrorResponse, 'error'> = {};

  /**
   * Instantiates a new OAuth 2.0 Exception.
   *
   * @param description Description of the Error.
   */
  public constructor(description?: Optional<string>) {
    super(description);

    this.data.error_description = description;
  }

  /**
   * Sets a HTTP Response Header of the OAuth 2.0 Exception.
   *
   * @param header Name of the HTTP Response Header.
   * @param value Value of the HTTP Response Header.
   */
  public setHeader(header: string, value: OutgoingHttpHeader): OAuth2Exception {
    this.headers[header] = value;
    return this;
  }

  /**
   * Sets multiple HTTP Response Headers of the OAuth 2.0 Exception.
   *
   * @param headers HTTP Response Headers.
   */
  public setHeaders(headers: OutgoingHttpHeaders): OAuth2Exception {
    Object.assign(this.headers, headers);
    return this;
  }

  /**
   * Sets a new entry on the data of the Error.
   *
   * @param name Name of the Error Parameter.
   * @param value Value of the Error Parameter.
   */
  public setParameter(name: string, value: any): OAuth2Exception {
    if (name === 'error') {
      throw new TypeError('Cannot reset the code of the error.');
    }

    this.data[name] = value;
    return this;
  }

  /**
   * Parameters of the OAuth 2.0 Exception.
   */
  public toJSON(): ErrorResponse {
    return removeNullishValues<ErrorResponse>({ error: this.errorCode, ...this.data });
  }
}
