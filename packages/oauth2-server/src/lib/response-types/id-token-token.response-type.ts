import { Inject, Injectable } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { ResponseMode } from '../response-modes/response-mode.type';
import { IdTokenAuthorizationResponse } from '../responses/authorization/id-token.authorization-response';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

/**
 * Implementation of the **ID Token Token** Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives an Access Token and ID Token
 * without the need for a second visit to the Authorization Server.
 *
 * The tokens are returned at the Redirect URI of the Client.
 *
 * This **COULD** lead to a potential security issue, since the URI is usually saved at the browser's history.
 * A malware could read the history and extract the tokens from one of the Authorization Responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2
 * @see https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth
 */
@Injectable()
export class IdTokenTokenResponseType implements ResponseTypeInterface {
  /**
   * Name of the Response Type.
   */
  public readonly name: ResponseType = 'id_token token';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: ResponseMode = 'fragment';

  /**
   * Instantiates a new ID Token Token Response Type.
   *
   * @param idTokenHandler Instance of the ID Token Handler.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly idTokenHandler: IdTokenHandler,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
  ) {}

  /**
   * Creates and returns an Access Token and ID Token Response to the Client.
   *
   * @param _context Authorization Request Context.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Access Token and ID Token Response.
   */
  public async handle(
    _context: AuthorizationContext,
    login: Login,
    consent: Consent,
  ): Promise<TokenAuthorizationResponse & IdTokenAuthorizationResponse> {
    const { client, scopes, user } = consent;

    if (!scopes.includes('openid')) {
      throw new InvalidRequestException('Missing required scope "openid".');
    }

    const accessToken = await this.accessTokenService.create(scopes, client, user);
    const idToken = await this.idTokenHandler.generateIdToken(login, consent, null, null, accessToken, null);

    const response = createTokenResponse(accessToken, null) as TokenAuthorizationResponse &
      IdTokenAuthorizationResponse;

    response.id_token = idToken;

    return response;
  }
}
