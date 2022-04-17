import { Dict, Optional } from '@guarani/types';

import { IncomingHttpHeaders } from 'http';

import { UserEntity } from '../entities/user.entity';
import { RequestParams } from './request.params';
import { SupportedHttpMethod } from './types/supported-http-method';

/**
 * Abstraction of the HTTP Request object received by the application.
 *
 * This class contains the necessary parameters for the correct implementation
 * of the **OAuth 2.0 Protocol** and its extensions.
 */
export class Request implements RequestParams {
  /**
   * Method of the Request.
   */
  public readonly method: SupportedHttpMethod;

  /**
   * URL Query Parameters.
   */
  public readonly query: Dict = {};

  /**
   * Headers of the Request.
   */
  public readonly headers: IncomingHttpHeaders = {};

  /**
   * Parsed Body of the Request.
   */
  public readonly body: Dict;

  /**
   * Authenticated End User of the Request.
   */
  public user?: Optional<UserEntity>;

  /**
   * Instantiates a new HTTP Request based on the provided Parameters.
   *
   * @param params Parameters of the HTTP Request.
   */
  public constructor(params: RequestParams) {
    const method = <SupportedHttpMethod>params.method.toLowerCase();

    if (method !== 'get' && method !== 'post') {
      // TODO: Create an error.
      throw new Error();
    }

    this.method = method;

    Object.entries(params.query).forEach(([param, value]) => {
      this.query[param.toLowerCase()] = value;
    });

    Object.entries(params.headers).forEach(([header, value]) => {
      this.headers[header.toLowerCase()] = value;
    });

    this.body = params.body;

    this.user = params.user;
  }

  /**
   * Data of the Request, retrieved from the Query and, if the HTTP Method is POST, merged with the Body.
   */
  public get data(): Dict {
    return this.method === 'get' ? this.query : { ...this.query, ...this.body };
  }
}
