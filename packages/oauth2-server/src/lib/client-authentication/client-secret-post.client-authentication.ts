import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';

import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthenticationInterface } from './client-authentication.interface';
import { ClientAuthentication } from './client-authentication.type';
import { ClientSecretPostClientAuthenticationParameters } from './client-secret-post.client-authentication.parameters';

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
    this.logger.debug(`[${this.constructor.name}] Called hasBeenRequested()`, 'c781b93e-500d-4bce-9cf4-45d5524f0e07', {
      request,
    });

    const { client_id: clientId, client_secret: clientSecret } =
      request.form<ClientSecretPostClientAuthenticationParameters>();

    const result = typeof clientId === 'string' && typeof clientSecret === 'string';

    this.logger.debug(
      `[${this.constructor.name}] Completed hasBeenRequested()`,
      'd3d43217-377a-4eef-b129-80447667db52',
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
    this.logger.debug(`[${this.constructor.name}] Called authenticate()`, '5e1d39ce-1d62-43f3-960f-37384b5467a6', {
      request,
    });

    const { client_id: clientId, client_secret: clientSecret } =
      request.form<ClientSecretPostClientAuthenticationParameters>();

    this.logger.debug(
      `[${this.constructor.name}] Searching for a Client with the provided Identifier`,
      'e9a67b81-9f47-4df8-a91e-b3c586874efa',
      { id: clientId },
    );

    const client = await this.clientService.findOne(clientId);

    if (client === null) {
      const exc = new InvalidClientException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Could not find a Client with the provided Identifier`,
        '69d39def-338e-485f-aac1-a5aebc59492b',
        { id: clientId },
        exc,
      );

      throw exc;
    }

    if (client.secret === null) {
      const exc = new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`,
      );

      this.logger.error(
        `[${this.constructor.name}] The Client does not have a Secret`,
        'ee6ac42e-5a45-4aa0-be45-9cd79090db9c',
        { client },
        exc,
      );

      throw exc;
    }

    const expectedClientSecret = Buffer.from(client.secret, 'utf8');
    const receivedClientSecret = Buffer.from(clientSecret, 'utf8');

    if (expectedClientSecret.length !== receivedClientSecret.length) {
      const exc = new InvalidClientException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] The Client provided a mismatching Secret`,
        '766da294-ff6a-408c-8303-963c5cf6c506',
        { client },
        exc,
      );

      throw exc;
    }

    if (!timingSafeEqual(expectedClientSecret, receivedClientSecret)) {
      const exc = new InvalidClientException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] The Client provided a mismatching Secret`,
        '0703bb41-5a5c-43c2-b654-6b0b0a9ebc62',
        { client },
        exc,
      );

      throw exc;
    }

    if (client.secretExpiresAt !== null && new Date() >= client.secretExpiresAt) {
      const exc = new InvalidClientException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] The Secret of the Client expired`,
        'bd8f614e-9bee-4838-99c5-1c6b4e3ff4e8',
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
        'ed422022-672b-475d-a939-d00a9f16ebaf',
        { client },
        exc,
      );

      throw exc;
    }

    this.logger.debug(`[${this.constructor.name}] Completed authenticate()`, 'bed88bc9-e88c-40b4-aa44-5b10608897f0', {
      request,
      client,
    });

    return client;
  }
}
