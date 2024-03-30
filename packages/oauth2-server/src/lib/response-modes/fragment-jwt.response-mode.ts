import { Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { AuthorizationResponseTokenHandler } from '../handlers/authorization-response-token.handler';
import { HttpResponse } from '../http/http.response';
import { Logger } from '../logger/logger';
import { addParametersToUrl } from '../utils/add-parameters-to-url';
import { ResponseModeInterface } from './response-mode.interface';
import { ResponseMode } from './response-mode.type';

/**
 * Implementation of the **Fragment JSON Web Token** Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-jarm.html#section-2.3.2
 */
@Injectable()
export class FragmentJwtResponseMode implements ResponseModeInterface {
  /**
   * Name of the Response Mode.
   */
  public readonly name: ResponseMode = 'fragment.jwt';

  /**
   * Instantiates a new Fragment JSON Web Token Response Mode.
   *
   * @param logger Logger of the Authorization Server.
   * @param authorizationResponseTokenHandler Instance of the JSON Web Token Authorization Response Token Handler.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly authorizationResponseTokenHandler: AuthorizationResponseTokenHandler,
  ) {}

  /**
   * Creates a Redirect Response to the provided Redirect URI with the provided Parameters
   * in a JSON Web Token at the Fragment of the URI.
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
      '3e1c4115-fb47-4d02-8e21-aae3df0a95d2',
      { context, parameters },
    );

    const token = await this.authorizationResponseTokenHandler.generateAuthorizationResponseToken(
      context,
      removeNullishValues(parameters),
    );

    const url = addParametersToUrl(context.redirectUri, { response: token }, 'hash');

    return new HttpResponse().redirect(url);
  }
}
