import { DependencyInjectionContainer, Injectable } from '@guarani/di';
import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { HttpResponse } from '../http/http.response';
import { Logger } from '../logger/logger';
import { ResponseModeInterface } from './response-mode.interface';
import { RESPONSE_MODE } from './response-mode.token';
import { ResponseMode } from './response-mode.type';

/**
 * Implementation of the **JSON Web Token** Response Mode.
 *
 * @see https://openid.net/specs/oauth-v2-jarm.html#section-2.3.4
 */
@Injectable()
export class JwtResponseMode implements ResponseModeInterface {
  /**
   * Name of the Response Mode.
   */
  public readonly name: ResponseMode = 'jwt';

  /**
   * Instantiates a new JSON Web Token Response Mode.
   *
   * @param logger Logger of the Authorization Server.
   * @param container Instance of the Dependency Injection Container.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly container: DependencyInjectionContainer,
  ) {}

  /**
   * Creates a Redirect Response to the provided Redirect URI with the provided Parameters in a JSON Web Token
   * based on the default Response Mode of the Response Type selected by the Client.
   *
   * @param context Context of the Authorization Request.
   * @param parameters Authorization Response Parameters that will be returned to the Client Application.
   * @returns Http Response containing the Authorization Response Parameters.
   */
  // TODO: Check if this is ever called
  public async createHttpResponse(
    context: AuthorizationContext,
    parameters: Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>>,
  ): Promise<HttpResponse> {
    this.logger.debug(
      `[${this.constructor.name}] Called createHttpResponse()`,
      'b967163b-5b87-4f8b-ae96-21ea015697e0',
      { context, parameters },
    );

    const jwtResponseModeName = `${context.responseType.defaultResponseMode}.jwt`;

    const responseMode = this.container
      .resolveAll<ResponseModeInterface>(RESPONSE_MODE)
      .find((responseMode) => responseMode.name === jwtResponseModeName)!;

    return await responseMode.createHttpResponse(context, parameters);
  }
}
