import { Inject, Injectable } from '@guarani/di';

import { ClientCredentialsTokenContext } from '../context/token/client-credentials.token-context';
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(ACCESS_TOKEN_SERVICE) private readonly accessTokenService: AccessTokenServiceInterface,
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
   * @param context Token Request Context.
   * @returns Access Token Response.
   */
  public async handle(context: ClientCredentialsTokenContext): Promise<TokenResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '8f2a4dab-7cb6-4c10-a2bd-8e0acfdfcc8b', {
      context,
    });

    const { client, scopes } = context;
    const accessToken = await this.accessTokenService.create(scopes, client, null);
    const response = createTokenResponse(accessToken, null);

    this.logger.debug(
      `[${this.constructor.name}] Client Credentials Grant completed`,
      '44a96591-0413-43ca-8abe-7d36b129335e',
      { response },
    );

    return response;
  }
}
