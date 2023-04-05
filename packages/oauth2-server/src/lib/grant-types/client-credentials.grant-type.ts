import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { ScopeHandler } from '../handlers/scope.handler';
import { ClientCredentialsTokenRequest } from '../requests/token/client-credentials.token-request';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

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
export class ClientCredentialsGrantType implements GrantTypeInterface {
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
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface
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
  public async handle(parameters: ClientCredentialsTokenRequest, client: Client): Promise<TokenResponse> {
    this.scopeHandler.checkRequestedScope(parameters.scope);

    const scopes = this.scopeHandler.getAllowedScopes(client, parameters.scope);
    const accessToken = await this.accessTokenService.create(scopes, client);

    return createTokenResponse(accessToken);
  }
}
