import { Injectable } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
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
   * @param idTokenHandler Instance of the ID Token Handler.
   */
  public constructor(private readonly idTokenHandler: IdTokenHandler) {}

  /**
   * Creates and returns an ID Token Response to the Client.
   *
   * @param _context Authorization Request Context.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns ID Token Response.
   */
  public async handle(
    _context: AuthorizationContext,
    login: Login,
    consent: Consent,
  ): Promise<IdTokenAuthorizationResponse> {
    const { scopes } = consent;

    if (!scopes.includes('openid')) {
      throw new InvalidRequestException('Missing required scope "openid".');
    }

    const idToken = await this.idTokenHandler.generateIdToken(login, consent, null, null, null, null);

    return { id_token: idToken };
  }
}
