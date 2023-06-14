import { Dictionary } from '@guarani/types';

import { HttpResponse } from '../http/http.response';
import { Display } from './display.type';

/**
 * Interface of a Display.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
export interface DisplayInterface {
  /**
   * Name of the Display.
   */
  readonly name: Display;

  /**
   * Creates a Http Response to the provided Redirect URI based on the provided Parameters.
   *
   * @param redirectUri Url to be redirected.
   * @param parameters Parameters used to build the Http Response.
   * @returns Http Response to the provided Redirect URI.
   */
  createHttpResponse(redirectUri: string, parameters: Dictionary<string>): HttpResponse;
}
