import { Inject, Injectable } from '@guarani/di';

import { JwtBearerTokenContext } from '../context/token/jwt-bearer.token-context';
import { Logger } from '../logger/logger';
import { TokenResponse } from '../responses/token-response';
import { AccessTokenServiceInterface } from '../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../services/access-token.service.token';
import { createTokenResponse } from '../utils/create-token-response';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';

/**
 * Implementation of the **JWT Bearer** Grant Type.
 *
 * In this Grant Type the Client provides a JSON Web Token Assertion as its Authorization Grant
 * and exchanges it for an Access Token.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7523.html
 */
@Injectable()
export class JwtBearerGrantType implements GrantTypeInterface {
  /**
   * Name of the Grant Type.
   */
  public readonly name: GrantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

  /**
   * Instantiates a new JWT Bearer Grant Type.
   *
   * @param logger Logger of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
  ) {}

  /**
   * Creates an Access Token Response with the Access Token issued to the Client.
   *
   * In this flow, the Client presents a JSON Web Token Assertion signed with one of its JSON Web Keys
   * as an Authorization Grant for the Token Endpoint. Once the signature of the JSON Web Token is verified,
   * the Authorization Server issues an Access Token to the Client.
   *
   * It does not issue a Refresh Token, since the Client can generate a new JSON Web Token Assertion
   * and present it to the Token Endpoint without the need to reauthenticate the End User.
   *
   * @param context Token Request Context.
   * @returns Access Token Response.
   */
  public async handle(context: JwtBearerTokenContext): Promise<TokenResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '53ab68dd-bad6-435a-a990-57acf6ff2b9c', {
      context,
    });

    const { client, scopes, user } = context;
    const accessToken = await this.accessTokenService.create(scopes, client, user);
    const response = createTokenResponse(accessToken, null);

    this.logger.debug(`[${this.constructor.name}] JWT Bearer Grant completed`, 'aaef6e9c-c924-4d9b-bd75-0c25ac28a684', {
      response,
    });

    return response;
  }
}
