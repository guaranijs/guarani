import { Inject, Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { Consent } from '../entities/consent.entity';
import { AuthorizationRequest } from '../requests/authorization/authorization-request';
import { ResponseMode } from '../response-modes/response-mode.type';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { ResponseType } from './response-type.type';
import { ResponseTypeInterface } from './response-type.interface';
import { Login } from '../entities/login.entity';
import { AuthorizationContext } from '../context/authorization/authorization.context';

/**
 * Implementation of the **Token** Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives an Access Token without the need
 * for a second visit to the Authorization Server.
 *
 * The Access Token is returned at the Redirect URI of the Client.
 *
 * This **COULD** lead to a potential security issue, since the URI is usually saved at the browser's history.
 * A malware could read the history and extract the Access Token from one of the Authorization Responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2
 */
@Injectable()
export class TokenResponseType implements ResponseTypeInterface {
  /**
   * Name of the Response Type.
   */
  public readonly name: ResponseType = 'token';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: ResponseMode = 'fragment';

  /**
   * Instantiates a new Token Response Type.
   *
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(@Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface) {}

  /**
   * Creates and returns an Access Token Response to the Client.
   *
   * @param context Authorization Request Context.
   * @param _login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Access Token Response.
   */
  public async handle(
    context: AuthorizationContext<AuthorizationRequest>,
    _login: Login,
    consent: Consent
  ): Promise<TokenAuthorizationResponse> {
    const { parameters } = context;
    const { client, scopes, user } = consent;

    const accessToken = await this.accessTokenService.create(scopes, client, user);
    const token = createTokenResponse(accessToken);

    return removeNullishValues<TokenAuthorizationResponse>({ ...token, state: parameters.state });
  }
}
