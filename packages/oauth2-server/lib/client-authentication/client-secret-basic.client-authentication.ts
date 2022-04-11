import { Inject, Injectable } from '@guarani/ioc';

import { timingSafeEqual } from 'crypto';

import { ClientEntity } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { Request } from '../http/request';
import { ClientService } from '../services/client.service';
import { ClientAuthentication } from './client-authentication';
import { SupportedClientAuthentication } from './types/supported-client-authentication';

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
export class ClientSecretBasicClientAuthentication extends ClientAuthentication {
  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: SupportedClientAuthentication = 'client_secret_basic';

  /**
   * Defines the `WWW-Authenticate` HTTP Header in case of Client Authentication failure.
   */
  private readonly headers = { 'WWW-Authenticate': 'Basic' };

  /**
   * Instance of the Client Service.
   */
  private readonly clientService: ClientService;

  /**
   * Instantiates a new Client Secret Basic Client Authentication Method.
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
    return request.headers.authorization?.match(/^(Basic|Basic .*)$/) != null; // The "!=" is proposital.
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: Request): Promise<ClientEntity> {
    const { authorization } = request.headers;

    const [, token] = authorization!.split(' ', 2);

    if (token === undefined) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    if (!/^[a-zA-Z0-9+/=]+$/.test(token)) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    const credentials = Buffer.from(token, 'base64').toString('utf8');

    if (!credentials.includes(':')) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    const [clientId, clientSecret] = credentials.split(':', 2);

    if (clientId === '' || clientSecret === '') {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    const client = await this.clientService.findClient(clientId);

    if (client === undefined) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    if (client.secret === undefined) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    const expectedClientSecret = Buffer.from(client.secret, 'utf8');
    const receivedClientSecret = Buffer.from(clientSecret, 'utf8');

    if (expectedClientSecret.length !== receivedClientSecret.length) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    if (!timingSafeEqual(expectedClientSecret, receivedClientSecret)) {
      throw new InvalidClientException({ error_description: 'Invalid Credentials.' }).setHeaders(this.headers);
    }

    if (client.authenticationMethod !== this.name) {
      throw new InvalidClientException({
        error_description: `This Client is not allowed to use the Authentication Method "${this.name}".`,
      }).setHeaders(this.headers);
    }

    return client;
  }
}
