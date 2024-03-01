import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthenticationInterface } from './client-authentication.interface';
import { ClientAuthentication } from './client-authentication.type';
import { NoneClientAuthenticationParameters } from './none.client-authentication.parameters';

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
export class NoneClientAuthentication implements ClientAuthenticationInterface {
  /**
   * Name of the Client Authentication Method.
   */
  public readonly name: ClientAuthentication = 'none';

  /**
   * Instantiates a new None Client Authentication Method.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientService Instance of the Client Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(CLIENT_SERVICE) private readonly clientService: ClientServiceInterface,
  ) {}

  /**
   * Checks if the Client Authentication Method has been requested by the Client.
   *
   * @param request Http Request.
   */
  public hasBeenRequested(request: HttpRequest): boolean {
    this.logger.debug(`[${this.constructor.name}] Called hasBeenRequested()`, '20f8b03e-bd38-4bdc-85a4-b5c5cfeb5e56', {
      request,
    });

    const { client_id: clientId, client_secret: clientSecret } = request.form<NoneClientAuthenticationParameters>();

    const result = typeof clientId === 'string' && typeof clientSecret === 'undefined';

    this.logger.debug(
      `[${this.constructor.name}] Completed hasBeenRequested()`,
      '1b82bb4b-b68d-468f-99e8-07200673fb89',
      { request, result },
    );

    return result;
  }

  /**
   * Authenticates and returns the Client of the Request.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    this.logger.debug(`[${this.constructor.name}] Called authenticate()`, 'f8dceb10-8e36-469f-86d6-b91b18023f49', {
      request,
    });

    const { client_id: clientId } = request.form<NoneClientAuthenticationParameters>();

    this.logger.debug(
      `[${this.constructor.name}] Searching for a Client with the provided Identifier`,
      '43288d4f-1b11-4fad-bf30-7d216761d0bf',
      { id: clientId },
    );

    const client = await this.clientService.findOne(clientId);

    if (client === null) {
      const exc = new InvalidClientException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Could not find a Client with the provided Identifier`,
        '46aed74d-4cd1-413b-9e2d-f8df273612ce',
        { id: clientId },
        exc,
      );

      throw exc;
    }

    if (client.secret !== null) {
      const exc = new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Client has a Secret`,
        'fdceadbc-efe2-4753-ac82-dc8667b5435d',
        { client },
        exc,
      );

      throw exc;
    }

    if (client.authenticationMethod !== this.name) {
      const exc = new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Client is not allowed to use the Authentication Method "${this.name}"`,
        '9234e12f-1aa5-46d0-9bb7-4c3bcc0043cb',
        { client },
        exc,
      );

      throw exc;
    }

    this.logger.debug(`[${this.constructor.name}] Completed authenticate()`, '84f8bbe4-6691-4158-a6bc-bde45ac4775e', {
      request,
      client,
    });

    return client;
  }
}
