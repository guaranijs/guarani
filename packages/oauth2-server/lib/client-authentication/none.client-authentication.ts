import { Inject, Injectable } from '@guarani/ioc';

import { Client } from '../entities/client';
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
}

/**
 * Implements the Client Authentication via the Request Body.
 *
 * If this workflow is enabled, it will look at the Request Body for a scheme similar to the following:
 *
 * ```rst
 *     client_id=client1
 * ```
 *
 * The Request Body often comes with more information that may pertain to a specific Endpoint or Authorization Grant.
 * In this case, the Request Body will be similar to the following:
 *
 * ```rst
 *     key1=value1&key2=value2&client_id=client1
 * ```
 *
 * In this workflow, if the Client provides a Secret, it will automatically fail,
 * since it is intended to be used by Public Clients.
 */
@Injectable()
export class NoneClientAuthentication implements ClientAuthentication {
  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: SupportedClientAuthentication = 'none';

  /**
   * Instance of the Client Service.
   */
  private readonly clientService: ClientService;

  /**
   * Instantiates a new None Client Authentication Method.
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
    return typeof request.body.client_id === 'string' && request.body.client_secret === undefined;
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: Request): Promise<Client> {
    const { client_id: clientId } = <ClientCredentials>request.body;

    const client = await this.clientService.findClient(clientId);

    if (client === null) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' });
    }

    if (client.secret !== null) {
      throw new InvalidClientException({
        error_description: `A Client with a Secret cannot use the Authentication Method "${this.name}".`,
      });
    }

    if (client.authenticationMethod !== this.name) {
      throw new InvalidClientException({
        error_description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      });
    }

    return client;
  }
}
