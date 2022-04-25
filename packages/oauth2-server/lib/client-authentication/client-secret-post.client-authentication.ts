import { Inject, Injectable } from '@guarani/ioc';

import { timingSafeEqual } from 'crypto';

import { ClientEntity } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { Request } from '../http/request';
import { ClientService } from '../services/client.service';
import { ClientAuthentication } from './client-authentication';
import { SupportedClientAuthentication } from './types/supported-client-authentication';

/**
 * Parameters passed by the Client on the HTTP Request Body.
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
export class ClientSecretPostClientAuthentication implements ClientAuthentication {
  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: SupportedClientAuthentication = 'client_secret_post';

  /**
   * Instance of the Client Service.
   */
  private readonly clientService: ClientService;

  /**
   * Instantiates a new Client Secret Post Client Authentication Method.
   *
   * @param clientService Instance of the Client Service.
   */
  public constructor(@Inject('ClientService') clientService: ClientService) {
    this.clientService = clientService;
  }

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request HTTP Request.
   */
  public hasBeenRequested(request: Request): boolean {
    return typeof request.body.client_id === 'string' && typeof request.body.client_secret === 'string';
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: Request): Promise<ClientEntity> {
    const { client_id: clientId, client_secret: clientSecret } = <ClientCredentials>request.body;

    const client = await this.clientService.findClient(clientId);

    if (client === null) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' });
    }

    if (client.secret === null) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' });
    }

    const expectedClientSecret = Buffer.from(client.secret, 'utf8');
    const receivedClientSecret = Buffer.from(clientSecret, 'utf8');

    if (expectedClientSecret.length !== receivedClientSecret.length) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' });
    }

    if (!timingSafeEqual(expectedClientSecret, receivedClientSecret)) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' });
    }

    if (client.authenticationMethod !== this.name) {
      throw new InvalidClientException({
        error_description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      });
    }

    return client;
  }
}
