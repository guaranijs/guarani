import { Injectable } from '@guarani/di';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { HttpResponse } from '../http/http.response';
import { Logger } from '../logger/logger';
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
   * Instantiates a new Page Display.
   *
   * @param logger Logger of the Authorization Server.
   */
  public constructor(protected readonly logger: Logger) {}

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
    this.logger.debug(
      `[${this.constructor.name}] Called createHttpResponse()`,
      '7030d2dc-d0e2-415e-a78e-06dbc8528816',
      { redirect_uri: redirectUri, parameters },
    );

    const url = addParametersToUrl(redirectUri, parameters);
    const response = new HttpResponse().redirect(url);

    this.logger.debug(
      `[${this.constructor.name}] Completed createHttpResponse()`,
      '48f15e51-f41c-42db-8a82-dc6b3f7eddc8',
      { response },
    );

    return response;
  }
}
