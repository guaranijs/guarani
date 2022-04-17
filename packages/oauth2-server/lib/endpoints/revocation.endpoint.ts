import { Injectable, InjectAll } from '@guarani/ioc';

import { OutgoingHttpHeaders } from 'http';

import { ClientAuthentication } from '../client-authentication/client-authentication';
import { ClientEntity } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { GrantType } from '../grant-types/grant-type';
import { Request } from '../http/request';
import { Response } from '../http/response';
import { Endpoint } from './endpoint';
import { RevocationParameters } from './types/revocation.parameters';
import { SupportedEndpoint } from './types/supported-endpoint';

/**
 * Endpoint used by the Client to revoke a Token in its possession.
 *
 * If the Client succeeds to authenticate but provides a token that was not issued to itself,
 * the Authorization server does revoke the token, since the Client is not authorized to operate it.
 *
 * If the token is already invalid, does not exist within the Authorization Server or is otherwise unknown or invalid,
 * it is already considered ***revoked*** and, therefore, no further operation occurs.
 */
@Injectable()
export abstract class RevocationEndpoint implements Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: SupportedEndpoint = 'revocation';

  /**
   * Default HTTP Headers to be included in the Response.
   */
  protected readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
  };

  /**
   * Client Authentication Methods registered at the Authorization Server.
   */
  private readonly clientAuthenticationMethods: ClientAuthentication[];

  /**
   * Instantiates a new Revocation Endpoint.
   *
   * @param grantTypes Grant Types registered at the Authorization Server.
   * @param clientAuthenticationMethods Client Authentication Methods registered at the Authorization Server.
   */
  public constructor(
    @InjectAll('GrantType') grantTypes: GrantType[],
    @InjectAll('ClientAuthentication') clientAuthenticationMethods: ClientAuthentication[]
  ) {
    if (!grantTypes.find((grantType) => grantType.name === 'refresh_token')) {
      throw new Error('The Authorization Server does not support Refresh Tokens.');
    }

    this.clientAuthenticationMethods = clientAuthenticationMethods;
  }

  /**
   * Revokes a previously issued Token.
   *
   * First it validates the Revocation Request of the Client by making sure the required parameter **token** is present,
   * and that the Client can authenticate within the Revocation Endpoint.
   *
   * It then tries to revoke the provided Token from the application's storage.
   *
   * Unless the Client presents an unsupported token_type_hint, fails to authenticate or does not present a token,
   * this endpoint will **ALWAYS** return a ***success*** response.
   *
   * This is done in order to prevent a Client from fishing any information that it should not have access to.
   *
   * @param request HTTP Request.
   * @returns HTTP Response.
   */
  public async handle(request: Request): Promise<Response> {
    const params = <RevocationParameters>request.body;

    try {
      this.checkParameters(params);

      const client = await this.authenticateClient(request);

      await this.revokeToken(request, client);

      return new Response().setHeaders(this.headers).json();
    } catch (exc: any) {
      const error = exc instanceof OAuth2Exception ? exc : new ServerErrorException({ error_description: exc.message });

      return new Response()
        .status(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }

  /**
   * Checks if the Parameters of the Revocation Request are valid.
   *
   * @param params Parameters of the Revocation Request.
   */
  protected checkParameters(params: RevocationParameters): void {
    const { token, token_type_hint } = params;

    if (typeof token !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "token".' });
    }

    if (token_type_hint !== undefined && !['access_token', 'refresh_token'].includes(token_type_hint)) {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "token_type_hint".' });
    }
  }

  /**
   * Authenticates the Client based on the Client Authentication Methods supported by the Authorization Server.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  private async authenticateClient(request: Request): Promise<ClientEntity> {
    const methods = this.clientAuthenticationMethods.filter((method) => method.hasBeenRequested(request));

    if (methods.length === 0) {
      throw new InvalidClientException({ error_description: 'No Client Authentication Method detected.' });
    }

    if (methods.length > 1) {
      throw new InvalidClientException({ error_description: 'Multiple Client Authentication Methods detected.' });
    }

    const method = methods.pop()!;

    return await method.authenticate(request);
  }

  /**
   * Revokes the provided Token from the application's storage.
   *
   * @param request Revocation Request.
   * @param client Authenticated Client.
   */
  protected abstract revokeToken(request: Request, client: ClientEntity): Promise<void>;
}
