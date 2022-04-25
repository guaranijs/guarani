import { Dict, Optional } from '@guarani/types';

import { IncomingHttpHeaders } from 'http';

import { User } from '../../entities/user';
import { SupportedHttpMethod } from '../types/supported-http-method';

/**
 * Parameters of the HTTP Request.
 */
export interface RequestParams {
  /**
   * Method of the Request.
   */
  readonly method: SupportedHttpMethod;

  /**
   * URL Query Parameters.
   */
  readonly query: Dict;

  /**
   * Headers of the Request.
   */
  readonly headers: IncomingHttpHeaders;

  /**
   * Parsed Body of the Request.
   */
  readonly body: Dict;

  /**
   * Authenticated End User of the Request.
   */
  readonly user?: Optional<User>;
}
