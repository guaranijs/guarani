import { Injectable, InjectAll } from '@guarani/di';

import { OutgoingHttpHeaders } from 'http';

import { Client } from '../entities/client.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { UnauthorizedClientException } from '../exceptions/unauthorized-client.exception';
import { UnsupportedGrantTypeException } from '../exceptions/unsupported-grant-type.exception';
import { GrantTypeInterface } from '../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../grant-types/grant-type.token';
import { GrantType } from '../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { HttpMethod } from '../http/http-method.type';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { TokenRequest } from '../messages/token-request';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Token** Endpoint.
 *
 * This endpoint is used by the Client to exchange an Authorization Grant for an Access Token
 * that will be used to act on behalf of the Resource Owner.
 *
 * @see https://www.rfc-editor.org/rfc/rfc6749.html#section-3.2
 */
@Injectable()
export class TokenEndpoint implements EndpointInterface {
  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'token';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/token';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Token Endpoint.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param grantTypes Grant Types supported by the Authorization Server.
   */
  public constructor(
    private readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    @InjectAll(GRANT_TYPE) private readonly grantTypes: GrantTypeInterface[]
  ) {}

  /**
   * Creates a Http JSON Access Token Response.
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
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    const parameters = <TokenRequest>request.body;

    try {
      this.checkParameters(parameters);

      const grantType = this.getGrantType(parameters.grant_type);
      const client = await this.clientAuthenticationHandler.authenticate(request);

      this.checkClientGrantType(client, grantType.name);

      const tokenResponse = await grantType.handle(parameters, client);

      return new HttpResponse().setHeaders(this.headers).json(tokenResponse);
    } catch (exc: unknown) {
      let error: OAuth2Exception;

      if (exc instanceof OAuth2Exception) {
        error = exc;
      } else {
        error = new ServerErrorException({ description: 'An unexpected error occurred.' });
        error.cause = exc;
      }

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(error.toJSON());
    }
  }

  /**
   * Checks if the Parameters of the Token Request are valid.
   *
   * @param parameters Parameters of the Token Request.
   */
  private checkParameters(parameters: TokenRequest): void {
    const { grant_type: grantType } = parameters;

    if (typeof grantType !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "grant_type".' });
    }
  }

  /**
   * Retrieves the Grant Type based on the **grant_type** requested by the Client.
   *
   * @param name Grant Type requested by the Client.
   * @returns Grant Type.
   */
  private getGrantType(name: GrantType): GrantTypeInterface {
    const grantType = this.grantTypes.find((grantType) => grantType.name === name);

    if (grantType === undefined) {
      throw new UnsupportedGrantTypeException({ description: `Unsupported grant_type "${name}".` });
    }

    return grantType;
  }

  /**
   * Checks if the Client is allowed to request the provided Grant Type.
   *
   * @param client Client of the Request.
   * @param grantType Grant Type requested by the Client.
   */
  private checkClientGrantType(client: Client, grantType: GrantType): void {
    if (!client.grantTypes.includes(grantType)) {
      throw new UnauthorizedClientException({
        description: `This Client is not allowed to request the grant_type "${grantType}".`,
      });
    }
  }
}
