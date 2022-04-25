import { Injectable, InjectAll } from '@guarani/ioc';

import { OutgoingHttpHeaders } from 'http';

import { ClientAuthentication } from '../client-authentication/client-authentication';
import { Client } from '../entities/client';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedGrantTypeException } from '../exceptions/unsupported-grant-type.exception';
import { GrantType } from '../grant-types/grant-type';
import { SupportedGrantType } from '../grant-types/types/supported-grant-type';
import { TokenParameters } from '../grant-types/types/token.parameters';
import { Request } from '../http/request';
import { Response } from '../http/response';
import { Endpoint } from './endpoint';
import { SupportedEndpoint } from './types/supported-endpoint';

/**
 * Endpoint used by the Client to exchange an Authorization Grant, or its own credentials,
 * for an Access Token that will be used to act on behalf of the Resource Owner.
 */
@Injectable()
export class TokenEndpoint implements Endpoint {
  /**
   * Name of the Endpoint.
   */
  public readonly name: SupportedEndpoint = 'token';

  /**
   * Default HTTP Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
  };

  /**
   * Client Authentication Methods registered at the Authorization Server.
   */
  private readonly clientAuthenticationMethods: ClientAuthentication[];

  /**
   * Grant Types registered at the Authorization Server.
   */
  private readonly grantTypes: GrantType[];

  /**
   * Instantiates a new Token Endpoint.
   *
   * @param clientAuthenticationMethods Client Authentication Methods registered at the Authorization Server.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    @InjectAll('ClientAuthentication') clientAuthenticationMethods: ClientAuthentication[],
    @InjectAll('GrantType') grantTypes: GrantType[]
  ) {
    this.clientAuthenticationMethods = clientAuthenticationMethods;
    this.grantTypes = grantTypes;
  }

  /**
   * Creates a HTTP JSON Token Response.
   *
   * This method is responsible for issuing Tokens to Clients that succeed to authenticate
   * within the Authorization Server and have the necessary consent of the Resource Owner.
   *
   * If the Client fails to authenticate within the Authorization Server, does not have the consent
   * of the Resource Owner, or provides invalid or insufficient request parameters,
   * it will receive a **400 Bad Request** Error Response with a JSON object describing the error.
   *
   * If the flow succeeds, the Client will then receive its Token in a JSON object containing the Access Token,
   * the Token Type, the Lifespan of the Access Token, the scopes of the Access Token, and an optional Refresh Token,
   * as well as any optional parameters defined by supplementar specifications.
   *
   * @param request HTTP Request.
   * @returns HTTP Response.
   */
  public async handle(request: Request): Promise<Response> {
    const params = <TokenParameters>request.body;

    try {
      this.checkParameters(params);

      const grantType = this.getGrantType(params.grant_type);
      const client = await this.authenticateClient(request);

      this.checkClientGrantType(client, grantType);

      const accessTokenResponse = await grantType.createTokenResponse(request, client);

      return new Response().setHeaders(this.headers).json(accessTokenResponse);
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
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param params Parameters of the Token Request.
   */
  private checkParameters(params: TokenParameters): void {
    const { grant_type } = params;

    if (typeof grant_type !== 'string') {
      throw new InvalidRequestException({ error_description: 'Invalid parameter "grant_type".' });
    }
  }

  /**
   * Retrieves the Grant Type based on the **grant_type** requested by the Client.
   *
   * @param name Grant Type requested by the Client.
   * @returns Grant Type.
   */
  private getGrantType(name: SupportedGrantType): GrantType {
    const grantType = this.grantTypes.find((grantType) => grantType.name === name);

    if (grantType === undefined) {
      throw new UnsupportedGrantTypeException({ error_description: `Unsupported grant_type "${name}".` });
    }

    return grantType;
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
   * Checks if the Client is allowed to use the requested Grant Type.
   *
   * @param client Client of the Request.
   * @param grantType Grant Type requested by the Client.
   */
  private checkClientGrantType(client: Client, grantType: GrantType): void {
    if (!client.grantTypes.includes(grantType.name)) {
      throw new UnauthorizedClientException({
        error_description: `This Client is not allowed to request the grant_type "${grantType.name}".`,
      });
    }
  }
}
