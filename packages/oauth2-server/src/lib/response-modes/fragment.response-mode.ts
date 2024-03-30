import { Injectable } from '@guarani/di';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { HttpResponse } from '../http/http.response';
import { Logger } from '../logger/logger';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { ResponseModeInterface } from './response-mode.interface';
import { ResponseMode } from './response-mode.type';

/**
 * Implementation of the **Fragment** Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes
 */
@Injectable()
export class FragmentResponseMode implements ResponseModeInterface {
  /**
   * Name of the Response Mode.
   */
  public readonly name: ResponseMode = 'fragment';

  /**
   * Instantiates a new Fragment Response Mode.
   *
   * @param logger Logger of the Authorization Server.
   */
  public constructor(private readonly logger: Logger) {}

  /**
   * Creates a Redirect Response to the provided Redirect URI with the provided Parameters at the Fragment of the URI.
   *
   * @param context Context of the Authorization Request.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Http Response containing the Authorization Response Parameters.
   */
  public async createHttpResponse(
    context: AuthorizationContext,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  ): Promise<HttpResponse> {
    this.logger.debug(
      `[${this.constructor.name}] Called createHttpResponse()`,
      '9be733ea-e62f-4aa2-92cc-696f6caa877f',
      { context, parameters },
    );

    const url = addParametersToUrl(context.redirectUri, parameters, 'hash');

    return new HttpResponse().redirect(url);
  }
}
