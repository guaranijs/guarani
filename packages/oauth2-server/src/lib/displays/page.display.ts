import { Injectable } from '@guarani/di';

import { URL, URLSearchParams } from 'url';

import { HttpResponse } from '../http/http.response';
import { DisplayInterface } from './display.interface';
import { Display } from './display.type';

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
  public createHttpResponse(redirectUri: string, parameters: Record<string, any>): HttpResponse {
    const url = new URL(redirectUri);
    const searchParameters = new URLSearchParams(parameters);

    url.search = searchParameters.toString();

    return new HttpResponse().redirect(url);
  }
}
