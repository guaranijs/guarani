import { Inject, Injectable } from '@guarani/ioc';
import { removeNullishValues } from '@guarani/objects';

import { ClientEntity } from '../entities/client.entity';
import { UserEntity } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { Request } from '../http/request';
import { SupportedResponseMode } from '../response-modes/types/supported-response-mode';
import { AccessTokenService } from '../services/access-token.service';
import { AccessTokenResponse } from '../types/access-token.response';
import { ResponseType } from './response-type';
import { AuthorizationParameters } from './types/authorization.parameters';
import { SupportedResponseType } from './types/supported-response-type';

/**
 * Implementation of the Token Response Type.
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
export class TokenResponseType extends ResponseType {
  /**
   * Name of the Response Type.
   */
  public readonly name: SupportedResponseType = 'token';

  /**
   * Default Response Mode of the Response Type.
   */
  public readonly defaultResponseMode: SupportedResponseMode = 'fragment';

  /**
   * Instance of the Access Token Service.
   */
  private readonly accessTokenService: AccessTokenService;

  /**
   * Instantiates a new Token Response Type.
   *
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(@Inject('AccessTokenService') accessTokenService: AccessTokenService) {
    super();

    this.accessTokenService = accessTokenService;
  }

  /**
   * Creates the Authorization Response with the Authorization Grant used by the Client on behalf of the End User.
   *
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @param user End User represented by the Client.
   * @returns Authorization Response.
   */
  public async createAuthorizationResponse(
    request: Request,
    client: ClientEntity,
    user: UserEntity
  ): Promise<AccessTokenResponse> {
    const params = <AuthorizationParameters>request.data;

    this.checkParameters(params);

    const scopes = this.getAllowedScopes(client, params.scope);

    const accessToken = await this.accessTokenService.createAccessToken('implicit', scopes, client, user);

    return removeNullishValues<AccessTokenResponse>({
      access_token: accessToken.token,
      token_type: 'Bearer',
      expires_in: accessToken.lifetime,
      scope: scopes.join(' '),
      state: params.state,
    });
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param params Parameters of the Authorization Request.
   */
  private checkParameters(params: AuthorizationParameters): void {
    const { response_mode } = params;

    if (response_mode === 'query') {
      throw new InvalidRequestException({
        error_description: `Invalid response_mode "query" for response_type "token".`,
      });
    }
  }
}
