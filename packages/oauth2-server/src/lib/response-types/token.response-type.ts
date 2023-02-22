import { Inject, Injectable } from '@guarani/di';

import { Consent } from '../entities/consent.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { AuthorizationRequest } from '../messages/authorization-request';
import { TokenAuthorizationResponse } from '../messages/token.authorization-response';
import { ResponseMode } from '../response-modes/response-mode.type';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { ResponseType } from './response-type.type';
import { ResponseTypeInterface } from './response-type.interface';
import { Session } from '../entities/session.entity';

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
   * @param parameters Parameters of the Authorization Request.
   * @param _session Session with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Access Token Response.
   */
  public async handle(
    parameters: AuthorizationRequest,
    _session: Session,
    consent: Consent
  ): Promise<TokenAuthorizationResponse> {
    const { client, scopes, user } = consent;

    this.checkParameters(parameters);

    const accessToken = await this.accessTokenService.create(scopes, client, user);
    const token = createTokenResponse(accessToken);

    return <TokenAuthorizationResponse>{ ...token, state: parameters.state };
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: AuthorizationRequest): void {
    const { response_mode: responseMode } = parameters;

    if (responseMode === 'query') {
      throw new InvalidRequestException({
        description: 'Invalid response_mode "query" for response_type "token".',
        state: parameters.state,
      });
    }
  }
}
