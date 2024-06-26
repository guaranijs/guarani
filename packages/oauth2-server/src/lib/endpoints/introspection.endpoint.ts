import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { Inject, Injectable } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';

import { IntrospectionContext } from '../context/introspection-context';
import { AccessToken } from '../entities/access-token.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { OAuth2Exception } from '../exceptions/oauth2.exception';
import { ServerErrorException } from '../exceptions/server-error.exception';
import { HttpRequest } from '../http/http.request';
import { HttpResponse } from '../http/http.response';
import { HttpMethod } from '../http/http-method.type';
import { Logger } from '../logger/logger';
import { IntrospectionResponse } from '../responses/introspection-response';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { calculateSubjectIdentifier } from '../utils/calculate-subject-identifier';
import { IntrospectionRequestValidator } from '../validators/introspection-request.validator';
import { EndpointInterface } from './endpoint.interface';
import { Endpoint } from './endpoint.type';

/**
 * Implementation of the **Introspection** Endpoint.
 *
 * This endpoint is used by the Client to obtain information about a Token in its possession.
 *
 * If the Client succeeds to authenticate but provides a Token that was not issued to itself, is invalid,
 * does not exist within the Authorization Server, or is otherwise unknown or invalid, it will return
 * a standard response of the format `{"active": false}`.
 *
 * If every verification step passes, then the Authorization Server returns the information
 * associated to the Token back to the Client.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7662.html
 */
@Injectable()
export class IntrospectionEndpoint implements EndpointInterface {
  /**
   * Inactive Token Standard Response.
   */
  private static readonly INACTIVE_TOKEN: IntrospectionResponse = { active: false };

  /**
   * Name of the Endpoint.
   */
  public readonly name: Endpoint = 'introspection';

  /**
   * Path of the Endpoint.
   */
  public readonly path: string = '/oauth/introspect';

  /**
   * Http Methods supported by the Endpoint.
   */
  public readonly httpMethods: HttpMethod[] = ['POST'];

  /**
   * Default Http Headers to be included in the Response.
   */
  private readonly headers: OutgoingHttpHeaders = { 'Cache-Control': 'no-store', Pragma: 'no-cache' };

  /**
   * Instantiates a new Introspection Endpoint.
   *
   * @param logger Logger of the Authorization Server.
   * @param validator Instance of the Introspection Request Validator.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly validator: IntrospectionRequestValidator,
    @Inject(SETTINGS) private readonly settings: Settings,
  ) {}

  /**
   * Introspects the provided Token about its metadata and state within the Authorization Server.
   *
   * First it validates the  Request of the Client by making sure the required parameter **token** is present,
   * and that the Client can authenticate within the Endpoint.
   *
   * It then tries to lookup the information about the Token from the application's storage.
   *
   * If the Client passes the authentication, the token is still valid, and the Client is the owner of the token,
   * this method will return the Token's metadata back to the Client.
   *
   * If it is determined that the Client should not have access to the Token's metadata, or if the Token
   * is not valid anymore, this method will return an Introspection Response in the format `{"active": false}`.
   *
   * This is done in order to prevent a Client from fishing any information that it should not have access to.
   *
   * @param request Http Request.
   * @returns Http Response.
   */
  public async handle(request: HttpRequest): Promise<HttpResponse> {
    this.logger.debug(`[${this.constructor.name}] Called handle()`, '796a5007-f082-4f77-8867-137c7ff068b6', {
      request,
    });

    try {
      const context = await this.validator.validate(request);
      const introspectionResponse = this.introspectToken(context);

      const response = new HttpResponse().setHeaders(this.headers).json(introspectionResponse);

      this.logger.debug(`[${this.constructor.name}] Introspection completed`, 'd6572cdb-a2a3-49a0-b18b-6b70b509a8dc', {
        response,
      });

      return response;
    } catch (exc: unknown) {
      const error =
        exc instanceof OAuth2Exception
          ? exc
          : new ServerErrorException('An unexpected error occurred.', { cause: exc });

      this.logger.error(
        `[${this.constructor.name}] Error on Introspection Endpoint`,
        'b414272e-fc3b-49b6-a579-75ab14fc1d21',
        { request },
        error,
      );

      return new HttpResponse()
        .setStatus(error.statusCode)
        .setHeaders(error.headers)
        .setHeaders(this.headers)
        .json(removeNullishValues(error.toJSON()));
    }
  }

  /**
   * Introspects the provide Token for its metadata.
   *
   * @param context Introspection Context.
   * @returns Metadata of the Token.
   */
  private introspectToken(context: IntrospectionContext): IntrospectionResponse {
    this.logger.debug(`[${this.constructor.name}] Called introspectToken()`, '95863c4e-0550-42bc-a5cb-7147140882ac', {
      context,
    });

    const { client, token } = context;

    if (token === null) {
      this.logger.debug(`[${this.constructor.name}] No Token found`, 'f3b27330-e6f7-4eba-9eba-6a29c0184bca');
      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    if (!this.checkTokenClient(token, client)) {
      this.logger.debug(
        `[${this.constructor.name}] Token does not pertain to the Client`,
        'dd1621df-2e2d-4f74-b385-e128120f2d02',
        { context },
      );

      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    return this.getTokenMetadata(token);
  }

  /**
   * Checks if the Client of the Request is the same to which the Token was issued to.
   *
   * @param token Instance of the Token retrieved based on the Identifier provided by the Client.
   * @param client Client of the Request.
   * @returns The Client of the Request is the same to which the Token was issued to.
   */
  private checkTokenClient(token: AccessToken | RefreshToken, client: Client): boolean {
    const clientIdBuffer = Buffer.from(client.id, 'utf8');
    const tokenClientIdBuffer = Buffer.from(token.client!.id, 'utf8');

    return clientIdBuffer.length === tokenClientIdBuffer.length && timingSafeEqual(clientIdBuffer, tokenClientIdBuffer);
  }

  /**
   * Returns the metadata of the provided Token Entity.
   *
   * @param token Token Entity to be introspected.
   * @returns Metadata of the provided Token Entity.
   */
  private getTokenMetadata(token: AccessToken | RefreshToken): IntrospectionResponse {
    this.logger.debug(`[${this.constructor.name}] Called getTokenMetadata()`, '637debf9-3034-4e02-9810-39be24cf97fc', {
      token,
    });

    if (token.isRevoked) {
      this.logger.debug(`[${this.constructor.name}] Revoked Token`, '1503b260-3794-4a08-8d46-aff84c2c9a75', { token });
      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    if (new Date() < token.validAfter) {
      this.logger.debug(`[${this.constructor.name}] Token is not yet valid`, '5d67fc61-44f4-4330-9ce9-6e914bc4223b', {
        token,
      });

      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    if (new Date() >= token.expiresAt) {
      this.logger.debug(`[${this.constructor.name}] Expired Token`, 'e34865a7-a483-4d1c-9c17-2b7e720b26bc', { token });
      return IntrospectionEndpoint.INACTIVE_TOKEN;
    }

    // TODO: Add check for username and jti.
    // TODO: Add policy to restrict or add parameters.
    return removeNullishValues<IntrospectionResponse>({
      active: true,
      scope: token.scopes.join(' '),
      client_id: token.client!.id,
      username: undefined,
      token_type: 'Bearer',
      exp: Math.floor(token.expiresAt.getTime() / 1000),
      iat: Math.floor(token.issuedAt.getTime() / 1000),
      nbf: Math.floor(token.validAfter.getTime() / 1000),
      sub: token.user !== null ? calculateSubjectIdentifier(token.user, token.client!, this.settings) : undefined,
      aud: [token.client!.id],
      iss: this.settings.issuer,
      jti: undefined,
    });
  }
}
