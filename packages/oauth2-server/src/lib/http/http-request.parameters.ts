import { Buffer } from 'buffer';
import { IncomingHttpHeaders } from 'http';
import { URL } from 'url';

import { Dictionary } from '@guarani/types';

import { HttpMethod } from './http-method.type';

/**
 * Parameters of the Http Request.
 */
export interface HttpRequestParameters {
  /**
   * Method of the Http Request.
   */
  readonly method: HttpMethod;

  /**
   * Url of the Http Request.
   */
  readonly url: URL;

  /**
   * Headers of the Http Request.
   */
  readonly headers: IncomingHttpHeaders;

  /**
   * Cookies of the Http Request.
   */
  readonly cookies: Dictionary<unknown>;

  /**
   * Parsed Body of the Http Request.
   */
  readonly body: Buffer;
}
