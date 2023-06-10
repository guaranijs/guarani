import { OutgoingHttpHeader, OutgoingHttpHeaders } from 'http';

import { isPlainObject } from '@guarani/primitives';
import { Nullable } from '@guarani/types';

import { OAuth2ExceptionResponse } from './oauth2.exception.response';

/**
 * Exception Class for the errors that may happen during the authorization process.
 */
export abstract class OAuth2Exception extends Error {
  /**
   * OAuth 2.0 Error Code.
   */
  public abstract readonly error: string;

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public readonly statusCode: number = 400;

  /**
   * Http Response Headers of the OAuth 2.0 Exception.
   */
  public readonly headers: OutgoingHttpHeaders = {};

  /**
   * Description of the OAuth 2.0 Exception.
   */
  private description: Nullable<string> = null;

  /**
   * Error Page URI of the OAuth 2.0 Exception.
   */
  private uri: Nullable<string> = null;

  /**
   * Instantiates a new OAuth 2.0 Exception.
   *
   * @param parameters Parameters of the OAuth 2.0 Exception.
   */
  public constructor(description: Nullable<string> = null, options?: ErrorOptions) {
    if (typeof description !== 'string' && description !== null) {
      throw new TypeError('Invalid parameter "description".');
    }

    super(description ?? '', options);
    this.description = description;
  }

  /**
   * Sets a Http Response Header of the OAuth 2.0 Exception.
   *
   * @param header Name of the Http Response Header.
   * @param value Value of the Http Response Header.
   */
  public setHeader(header: string, value: OutgoingHttpHeader): OAuth2Exception {
    if (typeof header !== 'string') {
      throw new TypeError('Invalid parameter "header".');
    }

    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      (!Array.isArray(value) || value.length === 0 || value.some((element) => typeof element !== 'string'))
    ) {
      throw new TypeError('Invalid parameter "value".');
    }

    this.headers[header] = value;

    return this;
  }

  /**
   * Sets multiple Http Response Headers of the OAuth 2.0 Exception.
   *
   * @param headers Http Response Headers.
   */
  public setHeaders(headers: OutgoingHttpHeaders): OAuth2Exception {
    if (!isPlainObject(headers)) {
      throw new TypeError('Invalid parameter "headers".');
    }

    Object.values(headers).forEach((value) => {
      if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        (!Array.isArray(value) || value.length === 0 || value.some((element) => typeof element !== 'string'))
      ) {
        throw new TypeError('Invalid parameter "headers".');
      }
    });

    Object.assign(this.headers, headers);

    return this;
  }

  /**
   * Sets the Description of the OAuth 2.0 Exception.
   *
   * @param description Description of the OAuth 2.0 Exception.
   */
  public setDescription(description: string): OAuth2Exception {
    if (typeof description !== 'string') {
      throw new TypeError('Invalid parameter "description".');
    }

    this.description = description;
    this.message = description;

    return this;
  }

  /**
   * Sets the Error Page URI of the OAuth 2.0 Exception.
   *
   * @param uri Error Page URI of the OAuth 2.0 Exception.
   */
  public setUri(uri: string): OAuth2Exception {
    if (typeof uri !== 'string') {
      throw new TypeError('Invalid parameter "uri".');
    }

    this.uri = uri;

    return this;
  }

  /**
   * Body of the OAuth 2.0 Error Response.
   */
  public toJSON(): OAuth2ExceptionResponse {
    return {
      error: this.error,
      error_description: this.description ?? undefined,
      error_uri: this.uri ?? undefined,
    };
  }
}
