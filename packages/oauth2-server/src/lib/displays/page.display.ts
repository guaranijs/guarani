import { Injectable } from '@guarani/di';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { HttpResponse } from '../http/http.response';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { DisplayInterface } from './display.interface';
import { Display } from './display.type';

/**
 * Implementation of the **Page** Display.
 *
 * @see https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
 */
@Injectable()
export class PageDisplay implements DisplayInterface {
  /**
   * Name of the Display.
   */
  public readonly name: Display = 'page';

  /**
   * Creates a Http Response to the provided Redirect URI based on the provided Parameters.
   *
   * @param redirectUri Url to be redirected.
   * @param parameters Parameters used to build the Http Response.
   * @returns Http Response to the provided Redirect URI.
   */
  public createHttpResponse(
    redirectUri: string,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  ): HttpResponse {
    const url = addParametersToUrl(redirectUri, parameters);
    return new HttpResponse().redirect(url);
  }
}
