import { Injectable } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { Logger } from '../logger/logger';
import { ResponseMode } from '../response-modes/response-mode.type';
import { IdTokenAuthorizationResponse } from '../responses/authorization/id-token.authorization-response';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

/**
 * Implementation of the **ID Token** Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives an ID Token without the need
 * for a second visit to the Authorization Server.
 *
 * The ID Token is returned at the Redirect URI of the Client.
 *
 * This **COULD** lead to a potential security issue, since the URI is usually saved at the browser's history.
 * A malware could read the history and extract the ID Token from one of the Authorization Responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2
 * @see https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth
 */
@Injectable()
export class IdTokenResponseType implements ResponseTypeInterface {
  /**
   * Name of the Response Type.
   */
  public readonly name: ResponseType = 'id_token';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: ResponseMode = 'fragment';

  /**
   * Instantiates a new ID Token Response Type.
   *
   * @param logger Logger of the Authorization Server.
   * @param idTokenHandler Instance of the ID Token Handler.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly idTokenHandler: IdTokenHandler,
  ) {}

  /**
   * Creates and returns an ID Token Response to the Client.
   *
   * @param context Authorization Request Context.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns ID Token Response.
   */
  public async handle(
    context: AuthorizationContext,
    login: Login,
    consent: Consent,
  ): Promise<IdTokenAuthorizationResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, 'ff24603e-9667-47ba-9f3c-7c717b7ba104', {
      context,
      login,
      consent,
    });

    const { maxAge, nonce } = context;
    const { scopes } = consent;

    if (!scopes.includes('openid')) {
      const exc = new InvalidRequestException('Missing required scope "openid".');

      this.logger.error(
        `[${this.constructor.name}] Missing required scope "openid"`,
        'a39eab70-3a5b-46f4-85ba-e0d15923b18c',
        { scopes },
        exc,
      );

      throw exc;
    }

    const idToken = await this.idTokenHandler.generateIdToken(login, consent, null, null, {
      maxAge: maxAge ?? undefined,
      nonce: nonce ?? undefined,
    });

    const response: IdTokenAuthorizationResponse = { id_token: idToken };

    this.logger.debug(
      `[${this.constructor.name}] Completed "${this.name}" Response Type`,
      '5d9dbe34-1142-4397-80d8-a834e1577e36',
      { response },
    );

    return response;
  }
}
