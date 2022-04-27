import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client';
import { ScopeHandler } from '../handlers/scope.handler';
import { ClientCredentialsTokenParameters } from '../models/client-credentials.token-parameter';
import { TokenResponse } from '../models/token-response';
import { IAccessTokenService } from '../services/access-token.service.interface';
import { GrantType } from '../types/grant-type';
import { createTokenResponse } from '../utils/create-token-response';
import { IGrantType } from './grant-type.interface';

/**
 * Implementation of the **Client Credentials** Grant Type.
 *
 * In this Grant Type the Client exchanges its Credentials for an Access Token.
 *
 * At the most basic level, authenticating with the Token Endpoint is sufficient for the issuance of an Access Token.
 * A Refresh Token is **NOT** issued.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4
 */
@Injectable()
export class ClientCredentialsGrantType implements IGrantType {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'client_credentials';

  /**
   * Instantiates a new Client Credentials Grant Type.
   *
   * @param scopeHandler Scope Handler of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly scopeHandler: ScopeHandler,
    @Inject('AccessTokenService') private readonly accessTokenService: IAccessTokenService
  ) {}

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * In this flow the Authorization Server checks the Credentials of the Client and, if valid, issues an Access Token.
   * A Refresh Token is **NOT** issued.
   *
   * Since the Client asks for an Access Token on behalf of itself,
   * it is **RECOMMENDED** for the Access Token to have a small lifetime.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Access Token Response.
   */
  public async handle(parameters: ClientCredentialsTokenParameters, client: Client): Promise<TokenResponse> {
    this.scopeHandler.checkRequestedScope(parameters.scope);

    const scopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);
    const accessToken = await this.accessTokenService.createAccessToken(scopes, client);

    return createTokenResponse(accessToken);
  }
}
