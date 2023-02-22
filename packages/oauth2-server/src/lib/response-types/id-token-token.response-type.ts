import { Inject, Injectable } from '@guarani/di';

import { Consent } from '../entities/consent.entity';
import { Session } from '../entities/session.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { IdTokenHandler } from '../handlers/id-token.handler';
import { AuthorizationRequest } from '../messages/authorization-request';
import { IdTokenAuthorizationResponse } from '../messages/id-token.authorization-response';
import { TokenAuthorizationResponse } from '../messages/token.authorization-response';
import { ResponseMode } from '../response-modes/response-mode.type';
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
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface
  ) {}

  /**
   * Creates and returns an Access Token and ID Token Response to the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param session Session with the Authentication information of the End User.
   * @param consent Consent with the scopes granted by the End User.
   * @returns Access Token and ID Token Response.
   */
  public async handle(
    parameters: AuthorizationRequest,
    session: Session,
    consent: Consent
  ): Promise<TokenAuthorizationResponse & IdTokenAuthorizationResponse> {
    const { client, scopes, user } = consent;

    this.checkParameters(parameters);

    if (!scopes.includes('openid')) {
      throw new InvalidRequestException({ description: 'Missing required scope "openid".', state: parameters.state });
    }

    const accessToken = await this.accessTokenService.create(scopes, client, user);
    const idToken = await this.idTokenHandler.generateIdToken(session, consent, accessToken, null, {
      nonce: parameters.nonce,
    });

    const token = createTokenResponse(accessToken);

    token.id_token = idToken;

    return <TokenAuthorizationResponse & IdTokenAuthorizationResponse>{ ...token, state: parameters.state };
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: AuthorizationRequest): void {
    const { nonce, response_mode: responseMode } = parameters;

    if (nonce === undefined) {
      throw new InvalidRequestException({ description: 'Invalid parameter "nonce".', state: parameters.state });
    }

    if (responseMode === 'query') {
      throw new InvalidRequestException({
        description: 'Invalid response_mode "query" for response_type "id_token token".',
        state: parameters.state,
      });
    }
  }
}
