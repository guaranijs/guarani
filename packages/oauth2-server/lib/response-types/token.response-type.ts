import { Inject, Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/objects';

import { Client } from '../entities/client';
import { User } from '../entities/user';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { ScopeHandler } from '../handlers/scope.handler';
import { AuthorizationParameters } from '../models/authorization-parameters';
import { TokenAuthorizationResponse } from '../models/token.authorization-response';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { ResponseMode } from '../types/response-mode';
import { ResponseType } from '../types/response-type';
import { createTokenResponse } from '../utils/create-token-response';
import { IResponseType } from './response-type.interface';

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
export class TokenResponseType implements IResponseType {
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
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    @Inject('AccessTokenService') private readonly accessTokenService: IAccessTokenService
  ) {}

  /**
   * Creates and returns an Access Token Response to the Client.
   *
   * @param parameters Parameters of the Authorization Request.
   * @param client Client of the Request.
   * @param user End User represented by the Client.
   * @returns Access Token Response.
   */
  public async handle(
    parameters: AuthorizationParameters,
    client: Client,
    user: User
  ): Promise<TokenAuthorizationResponse> {
    this.checkParameters(parameters);

    const scopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);
    const accessToken = await this.accessTokenService.createAccessToken(scopes, client, user);
    const token = createTokenResponse(accessToken);

    return removeNullishValues<TokenAuthorizationResponse>({ ...token, state: parameters.state });
  }

  /**
   * Checks if the Parameters of the Authorization Request are valid.
   *
   * @param parameters Parameters of the Authorization Request.
   */
  private checkParameters(parameters: AuthorizationParameters): void {
    const { response_mode } = parameters;

    if (response_mode === 'query') {
      throw new InvalidRequestException(`Invalid response_mode "query" for response_type "token".`);
    }
  }
}
