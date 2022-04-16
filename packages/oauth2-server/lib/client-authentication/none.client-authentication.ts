import { Inject, Injectable } from '@guarani/ioc';

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
}

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
  public async authenticate(request: Request): Promise<ClientEntity> {
    const { client_id: clientId } = <ClientCredentials>request.body;

    const client = await this.clientService.findClient(clientId);

    if (client === undefined) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' });
    }

    if (client.secret !== undefined) {
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
