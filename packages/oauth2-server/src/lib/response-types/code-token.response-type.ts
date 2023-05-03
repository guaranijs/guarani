import { Inject, Injectable } from '@guarani/di';
import { removeUndefined } from '@guarani/primitives';

import { CodeAuthorizationContext } from '../context/authorization/code.authorization.context';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { ResponseMode } from '../response-modes/response-mode.type';
import { CodeAuthorizationResponse } from '../responses/authorization/code.authorization-response';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { AuthorizationCodeServiceInterface } from '../services/authorization-code.service.interface';
import { AUTHORIZATION_CODE_SERVICE } from '../services/authorization-code.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

/**
 * Implementation of the **Code Token** Response Type.
 *
 * In this Response Type the Client obtains consent from the End User and receives a Code Authorization Response
 * to exchange for an Access Token at the Token Endpoint an Access Token without the need for a second visit
 * to the Authorization Server.
 *
 * The tokens are returned at the Redirect URI of the Client.
 *
 * This **COULD** lead to a potential security issue, since the URI is usually saved at the browser's history.
 * A malware could read the history and extract the Access Token from one of the Authorization Responses.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2
 * @see https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth
 */
@Injectable()
export class CodeTokenResponseType implements ResponseTypeInterface {
  /**
   * Name of the Response Type.
   */
  public readonly name: ResponseType = 'code token';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: ResponseMode = 'fragment';

  /**
   * Instantiates a new Code Token Response Type.
   *
   * @param accessTokenService Instance of the Access Token Service.
   * @param authorizationCodeService Instance of the Authorization Code Service.
   */
  public constructor(
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(AUTHORIZATION_CODE_SERVICE) private readonly authorizationCodeService: AuthorizationCodeServiceInterface
  ) {}

  /**
   * Creates and returns an Authorization Code and Access Token Response to the Client.
   *
   * @param context Authorization Request Context.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Authorization Code and Access Token Response.
   */
  public async handle(
    context: CodeAuthorizationContext,
    login: Login,
    consent: Consent
  ): Promise<CodeAuthorizationResponse & TokenAuthorizationResponse> {
    const { parameters } = context;
    const { client, scopes, user } = consent;

    const authorizationCode = await this.authorizationCodeService.create(parameters, login, consent);
    const accessToken = await this.accessTokenService.create(scopes, client, user);

    const token = createTokenResponse(accessToken);

    return removeUndefined<CodeAuthorizationResponse & TokenAuthorizationResponse>({
      ...token,
      code: authorizationCode.code,
      state: parameters.state,
    });
  }
}
