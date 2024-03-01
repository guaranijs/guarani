import { Inject, Injectable } from '@guarani/di';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { Consent } from '../entities/consent.entity';
import { Login } from '../entities/login.entity';
import { Logger } from '../logger/logger';
import { ResponseMode } from '../response-modes/response-mode.type';
import { TokenAuthorizationResponse } from '../responses/authorization/token.authorization-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { ResponseTypeInterface } from './response-type.interface';
import { ResponseType } from './response-type.type';

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
   * @param logger Logger of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
  ) {}

  /**
   * Creates and returns an Access Token Response to the Client.
   *
   * @param context Authorization Request Context.
   * @param login Login with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Access Token Response.
   */
  public async handle(
    context: AuthorizationContext,
    login: Login,
    consent: Consent,
  ): Promise<TokenAuthorizationResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '3adcb696-a357-4ef5-aaef-f56a4f26efb4', {
      context,
      login,
      consent,
    });

    const { client, scopes, user } = consent;

    const accessToken = await this.accessTokenService.create(scopes, client, user);
    const response = createTokenResponse(accessToken, null) as TokenAuthorizationResponse;

    this.logger.debug(
      `[${this.constructor.name}] Completed "${this.name}" Response Type`,
      '8086e89d-02fc-4a67-9ba2-824d8c5b6471',
      { response },
    );

    return response;
  }
}
