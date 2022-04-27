import { Inject, Injectable } from '@guarani/di';

import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { Client } from '../entities/client';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { IClientService } from '../services/client.service.interface';
import { ClientAuthentication } from '../types/client-authentication';
import { IClientAuthentication } from './client-authentication.interface';

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
export class ClientSecretBasicClientAuthentication implements IClientAuthentication {
  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: ClientAuthentication = 'client_secret_basic';

  /**
   * Defines the `WWW-Authenticate` HTTP Header in case of Client Authentication failure.
   */
  private readonly headers: OutgoingHttpHeaders = { 'WWW-Authenticate': 'Basic' };

  /**
   * Instantiates a new Client Secret Basic Client Authentication Method.
   *
   * @param clientService Instance of the Client Service.
   */
  public constructor(@Inject('ClientService') private readonly clientService: IClientService) {}

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request HTTP Request.
   */
  public hasBeenRequested(request: HttpRequest): boolean {
    return request.headers.authorization?.startsWith('Basic') === true;
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    const { authorization } = request.headers;

    const [, token] = authorization!.split(' ', 2);

    if (token === undefined) {
      throw new InvalidClientException('Missing Token.').setHeaders(this.headers);
    }

    if (!/^[a-zA-Z0-9+/=]+$/.test(token)) {
      throw new InvalidClientException('Token is not a Base64 string.').setHeaders(this.headers);
    }

    const credentials = Buffer.from(token, 'base64').toString('utf8');

    if (!credentials.includes(':')) {
      throw new InvalidClientException('Missing Semicolon Separator.').setHeaders(this.headers);
    }

    const [clientId, clientSecret] = credentials.split(':', 2);

    if (clientId === '') {
      throw new InvalidClientException('Missing Client Identifier.').setHeaders(this.headers);
    }

    if (clientSecret === '') {
      throw new InvalidClientException('Missing Client Secret.').setHeaders(this.headers);
    }

    const client = await this.clientService.findClient(clientId);

    if (client === undefined) {
      throw new InvalidClientException('Invalid Credentials.').setHeaders(this.headers);
    }

    if (client.secret === undefined) {
      throw new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`
      ).setHeaders(this.headers);
    }

    const expectedClientSecret = Buffer.from(client.secret, 'utf8');
    const receivedClientSecret = Buffer.from(clientSecret, 'utf8');

    if (expectedClientSecret.length !== receivedClientSecret.length) {
      throw new InvalidClientException('Invalid Credentials.').setHeaders(this.headers);
    }

    if (!timingSafeEqual(expectedClientSecret, receivedClientSecret)) {
      throw new InvalidClientException('Invalid Credentials.').setHeaders(this.headers);
    }

    if (client.secretExpiresAt !== undefined && new Date() >= client.secretExpiresAt) {
      throw new InvalidClientException('Invalid Credentials.').setHeaders(this.headers);
    }

    if (client.authenticationMethod !== this.name) {
      throw new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`
      ).setHeaders(this.headers);
    }

    return client;
  }
}
