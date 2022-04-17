import { removeNullishValues } from '@guarani/objects';
import { Dict, Optional } from '@guarani/types';

import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http';

import { OAuth2ExceptionParams } from './types/oauth2.exception.params';
import { SupportedOAuth2ErrorCode } from './types/supported-oauth2-error-code';

/**
 * Errors that can happen during the authorization process.
 */
export abstract class OAuth2Exception extends Error {
  /**
   * OAuth 2.0 Error Code.
   */
  public abstract readonly errorCode: SupportedOAuth2ErrorCode;

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
  private data!: Dict;

  /**
   * Instantiates a new OAuth 2.0 Exception.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   */
  public constructor(params: Optional<Dict> = {}) {
    super();

    this.message = this.getErrorMessage(params);
    this.data = params;
  }

  /**
   * Creates the parsed message of the Error.
   *
   * @param params Parameters of the OAuth 2.0 Exception.
   * @returns Parsed Error message.
   */
  private getErrorMessage(params: Dict): string {
    let message = <string>this.errorCode;

    if (params.error_description !== undefined) {
      message = `"${message}": ${params.error_description}`;
    }

    return message;
  }

  /**
   * Sets the HTTP Response Status Code of the OAuth 2.0 Exception.
   *
   * @param statusCode HTTP Response Status Code.
   */
  public status(statusCode: number): OAuth2Exception {
    Reflect.set(this, 'statusCode', statusCode);
    return this;
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
   * Parameters of the OAuth 2.0 Exception.
   */
  public toJSON(): OAuth2ExceptionParams {
    return removeNullishValues<OAuth2ExceptionParams>({ error: this.errorCode, ...this.data });
  }
}
