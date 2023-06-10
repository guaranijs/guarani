import { URL } from 'url';

import { Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

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
  public createHttpResponse(redirectUri: string, parameters: Dictionary<any>): HttpResponse {
    const url = new URL(redirectUri);
    Object.entries(removeNullishValues(parameters)).forEach(([name, value]) => url.searchParams.set(name, value));
    return new HttpResponse().redirect(url);
  }
}
