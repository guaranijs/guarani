import { Inject, Injectable } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthentication } from './client-authentication.type';
import { ClientAuthenticationInterface } from './client-authentication.interface';

/**
 * Implements the Client Authentication via the Basic Authorization Header.
 *
 * If this workflow is enabled, it will look at the Authorization header for a scheme similar to the following:
 *
 * ```rst
 *     Basic Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=
 * ```
 *
 * This scheme denotes the type of the flow, which in this case is **Basic**, and the Client Credentials,
 * a Base64 Encoded String that contains the Client Credentials in the format `client_id:client_secret`.
 */
@Injectable()
export class ClientSecretBasicClientAuthentication implements ClientAuthenticationInterface {
  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: ClientAuthentication = 'client_secret_basic';

  /**
   * Defines the `WWW-Authenticate` Http Header in case of Client Authentication failure.
   */
  private readonly headers: OutgoingHttpHeaders = { 'WWW-Authenticate': 'Basic' };

  /**
   * Instantiates a new Client Secret Basic Client Authentication Method.
   *
   * @param clientService Instance of the Client Service.
   */
  public constructor(@Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface) {}

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  public hasBeenRequested(request: HttpRequest): boolean {
    return request.headers.authorization?.startsWith('Basic') === true;
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    const { authorization } = request.headers;

    const [, token] = (<string>authorization).split(' ', 2);

    if (token === undefined) {
      throw new InvalidClientException({ description: 'Missing Token.' }).setHeaders(this.headers);
    }

    if (!/^[a-zA-Z0-9+/=]+$/.test(token)) {
      throw new InvalidClientException({ description: 'Token is not a Base64 string.' }).setHeaders(this.headers);
    }

    const credentials = Buffer.from(token, 'base64').toString('utf8');

    if (!credentials.includes(':')) {
      throw new InvalidClientException({ description: 'Missing Semicolon Separator.' }).setHeaders(this.headers);
    }

    const [clientId, clientSecret] = credentials.split(':', 2);

    if (clientId === undefined || clientId === '') {
      throw new InvalidClientException({ description: 'Missing Client Identifier.' }).setHeaders(this.headers);
    }

    if (clientSecret === undefined || clientSecret === '') {
      throw new InvalidClientException({ description: 'Missing Client Secret.' }).setHeaders(this.headers);
    }

    const client = await this.clientService.findOne(clientId);

    if (client === null) {
      throw new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    if (client.secret == null) {
      throw new InvalidClientException({
        description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      }).setHeaders(this.headers);
    }

    const expectedClientSecret = Buffer.from(client.secret, 'utf8');
    const receivedClientSecret = Buffer.from(clientSecret, 'utf8');

    if (expectedClientSecret.length !== receivedClientSecret.length) {
      throw new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    if (!timingSafeEqual(expectedClientSecret, receivedClientSecret)) {
      throw new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    if (client.secretExpiresAt != null && new Date() >= client.secretExpiresAt) {
      throw new InvalidClientException({ description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    if (client.authenticationMethod !== this.name) {
      throw new InvalidClientException({
        description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      }).setHeaders(this.headers);
    }

    return client;
  }
}
