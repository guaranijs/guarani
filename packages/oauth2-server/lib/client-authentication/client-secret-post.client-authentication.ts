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

@Injectable()
export class ClientSecretPostClientAuthentication extends ClientAuthentication {
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
  public constructor(@Inject<ClientService>('ClientService') clientService: ClientService) {
    super();

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

    if (client === undefined) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' });
    }

    if (client.secret === undefined) {
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