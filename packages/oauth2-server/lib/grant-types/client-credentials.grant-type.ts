import { Inject, Injectable } from '@guarani/ioc';

import { ClientEntity } from '../entities/client.entity';
import { Request } from '../http/request';
import { AccessTokenService } from '../services/access-token.service';
import { AccessTokenResponse } from '../types/access-token.response';
import { createAccessTokenResponse, getAllowedScopes } from '../utils';
import { GrantType } from './grant-type';
import { ClientCredentialsParameters } from './types/client-credentials.parameters';
import { SupportedGrantType } from './types/supported-grant-type';

/**
 * Implementation of the Client Credentials Grant Type.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-4.4
 *
 * In this Grant Type the Client exchanges its Credentials for an Access Token.
 *
 * At the most basic level, authenticating with the Token Endpoint is sufficient for the issuance of an Access Token.
 * A Refresh Token is **NOT** issued.
 */
@Injectable()
export class ClientCredentialsGrantType implements GrantType {
  /**
   * Name of the Grant Type.
   */
  public readonly name: SupportedGrantType = 'client_credentials';

  /**
   * Instance of the Access Token Service.
   */
  private readonly accessTokenService: AccessTokenService;

  /**
   * Instantiates a new Client Credentials Grant Type.
   *
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(@Inject('AccessTokenService') accessTokenService: AccessTokenService) {
    this.accessTokenService = accessTokenService;
  }

  /**
   * Creates the Access Token Response with the Access Token issued to the Client.
   *
   * In this flow the Authorization Server checks the Credentials of the Client and, if valid, issues an Access Token.
   * A Refresh Token is **NOT** issued.
   *
   * Since the Client asks for an Access Token on behalf of itself, it is **RECOMMENDED**
   * for the Access Token to have a small lifetime.
   *
   * @param request HTTP Request.
   * @param client OAuth 2.0 Client of the Request.
   * @returns Access Token Response.
   */
  public async createTokenResponse(request: Request, client: ClientEntity): Promise<AccessTokenResponse> {
    const params = <ClientCredentialsParameters>request.body;
    const scopes = params.scope !== undefined ? getAllowedScopes(client, params.scope) : client.scopes;
    const accessToken = await this.accessTokenService.createAccessToken(this.name, scopes, client, null, null);

    return createAccessTokenResponse(accessToken);
  }
}
