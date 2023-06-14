import { URL } from 'url';

import { Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { HttpResponse } from '../http/http.response';
import { ResponseModeInterface } from './response-mode.interface';
import { ResponseMode } from './response-mode.type';

/**
 * Implementation of the **Query** Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes
 */
@Injectable()
export class QueryResponseMode implements ResponseModeInterface {
  /**
   * Name of the Response Mode.
   */
  public readonly name: ResponseMode = 'query';

  /**
   * Creates a Redirect Response to the provided Redirect URI with the provided Parameters at the Query of the URI.
   *
   * @param redirectUri Redirect URI that the User-Agent will be redirected to.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Http Response containing the Authorization Response Parameters.
   */
  public createHttpResponse(redirectUri: string, parameters: Dictionary<string>): HttpResponse {
    const url = new URL(redirectUri);
    Object.entries(removeNullishValues(parameters)).forEach(([name, value]) => url.searchParams.set(name, value!));
    return new HttpResponse().redirect(url);
  }
}
