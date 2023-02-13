import { Inject, Injectable } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthentication } from './client-authentication.type';
import { ClientAuthenticationInterface } from './client-authentication.interface';

/**
 * Parameters passed by the Client on the Http Request Body.
 */
interface ClientCredentials {
  /**
   * Client Identifier.
   */
  readonly client_id: string;

  /**
   * Client Secret.
   */
  readonly client_secret: string;
}

/**
 * Implements the Client Authentication via the Request Body.
 *
 * If this workflow is enabled, it will look at the Request Body for a scheme similar to the following:
 *
 * ```rst
 *     client_id=client1&client_secret=client1secret
 * ```
 *
 * The Request Body often comes with more information that may pertain to a specific Endpoint or Authorization Grant.
 * In this case, the Request Body will be similar to the following:
 *
 * ```rst
 *     key1=value1&key2=value2&client_id=client1&client_secret=client1secret
 * ```
 *
 * The usage of this scheme is **NOT RECOMMENDED** unless the Client is unable to use another scheme.
 */
@Injectable()
export class ClientSecretPostClientAuthentication implements ClientAuthenticationInterface {
  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: ClientAuthentication = 'client_secret_post';

  /**
   * Instantiates a new Client Secret Post Client Authentication Method.
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
    return typeof request.body.client_id === 'string' && typeof request.body.client_secret === 'string';
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    const { client_id: clientId, client_secret: clientSecret } = <ClientCredentials>request.body;

    const client = await this.clientService.findOne(clientId);

    if (client === null) {
      throw new InvalidClientException({ description: 'Invalid Credentials.' });
    }

    if (client.secret == null) {
      throw new InvalidClientException({
        description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      });
    }

    const expectedClientSecret = Buffer.from(client.secret, 'utf8');
    const receivedClientSecret = Buffer.from(clientSecret, 'utf8');

    if (expectedClientSecret.length !== receivedClientSecret.length) {
      throw new InvalidClientException({ description: 'Invalid Credentials.' });
    }

    if (!timingSafeEqual(expectedClientSecret, receivedClientSecret)) {
      throw new InvalidClientException({ description: 'Invalid Credentials.' });
    }

    if (client.secretExpiresAt != null && new Date() >= client.secretExpiresAt) {
      throw new InvalidClientException({ description: 'Invalid Credentials.' });
    }

    if (client.authenticationMethod !== this.name) {
      throw new InvalidClientException({
        description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      });
    }

    return client;
  }
}
