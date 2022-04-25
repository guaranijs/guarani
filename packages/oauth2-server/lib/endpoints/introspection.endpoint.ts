import { Injectable, InjectAll } from '@guarani/ioc';

import { OutgoingHttpHeaders } from 'http';

import { ClientAuthentication } from '../client-authentication/client-authentication';
import { Client } from '../entities/client';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { Request } from '../http/request';
import { Response } from '../http/response';
import { Endpoint } from './endpoint';
import { IntrospectionParameters } from './types/introspection.parameters';
import { IntrospectionResponse } from './types/introspection.response';
import { SupportedEndpoint } from './types/supported-endpoint';

/**
 * Endpoint used by the Client to obtain information about a Token in its possession.
 *
 * If the Client succeeds to authenticate but provides a Token that was not issued to itself, is invalid,
 * does not exist within the Authorization Server, or is otherwise unknown or invalid, it will return
 * a standard response of the format `{"active": false}`.
 *
 * If every verification step passes, then the Authorization Server returns the information
 * associated to the Token back to the Client.
 */
@Injectable()
export abstract class IntrospectionEndpoint implements Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: SupportedEndpoint = 'introspection';

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
   * Instantiates a new Introspection Endpoint.
   *
   * @param clientAuthenticationMethods Client Authentication Methods registered at the Authorization Server.
   */
  public constructor(@InjectAll('ClientAuthentication') clientAuthenticationMethods: ClientAuthentication[]) {
    this.clientAuthenticationMethods = clientAuthenticationMethods;
  }

  /**
   * Introspects the provided Token about its metadata and state within the Authorization Server.
   *
   * First it validates the Introspection Request of the Client by making sure the required parameter token is present,
   * and that the Client can authenticate within the Endpoint.
   *
   * It then tries to lookup the information about the Token from the application's storage.
   *
   * If the Client passes the authentication, the token is still valid, and the Client is the owner of the token,
   * this method shall return the Token's metadata back to the Client.
   * If it is determined that the Client should not have access to the Token's metadata, or if the Token
   * is not valid anymore, this method shall return an Introspection Response in the format `{"active": false}`.
   *
   * This is done in order to prevent a Client from fishing any information that it should not have access to.
   *
   * @param request HTTP Request.
   * @returns HTTP Response.
   */
  public async handle(request: Request): Promise<Response> {
    const params = <IntrospectionParameters>request.body;

    try {
      this.checkParameters(params);

      const client = await this.authenticateClient(request);
      const introspectionResponse = await this.introspectToken(request, client);

      return new Response().setHeaders(this.headers).json(introspectionResponse);
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
   * Checks if the Parameters of the Introspection Request are valid.
   *
   * @param params Parameters of the Introspection Request.
   */
  protected checkParameters(params: IntrospectionParameters): void {
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
  private async authenticateClient(request: Request): Promise<Client> {
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
   * introspects the provide Token for its metadata.
   *
   * @param request Introspection Request.
   * @param client Authenticated Client.
   * @returns Introspected metadata of the Token.
   */
  protected abstract introspectToken(request: Request, client: Client): Promise<IntrospectionResponse>;
}
