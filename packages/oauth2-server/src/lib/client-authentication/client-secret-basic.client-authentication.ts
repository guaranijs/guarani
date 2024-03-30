import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';
import { OutgoingHttpHeaders } from 'http';

import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { ClientServiceInterface } from '../services/client.service.interface';
import { CLIENT_SERVICE } from '../services/client.service.token';
import { ClientAuthenticationInterface } from './client-authentication.interface';
import { ClientAuthentication } from './client-authentication.type';

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
    this.logger.debug(`[${this.constructor.name}] Called hasBeenRequested()`, '3937a690-6e6d-4c45-bce0-4ed1585e5714', {
      request,
    });

    const result = request.headers.authorization?.startsWith('Basic') === true;

    this.logger.debug(
      `[${this.constructor.name}] Completed hasBeenRequested()`,
      '82d5b037-4d5f-4d90-ab5a-37c048ebaa70',
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
    this.logger.debug(`[${this.constructor.name}] Called authenticate()`, 'a2db6155-7c33-467a-a4f3-ed054a102a66', {
      request,
    });

    const { authorization } = request.headers;

    const [, token] = authorization!.split(' ', 2);

    if (typeof token === 'undefined') {
      const exc = new InvalidClientException('Missing Token.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client did not provide a valid Basic Token`,
        '0d7ac651-42f7-48c6-adf9-e6dae4bb67f6',
        { authorization },
        exc,
      );

      throw exc;
    }

    if (!/^[a-zA-Z0-9+/=]+$/.test(token)) {
      const exc = new InvalidClientException('Token is not a Base64 string.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client provided an invalid Basic Token`,
        '73a5fda0-9fde-4691-a7ac-e8cd8e8955ae',
        { token },
        exc,
      );

      throw exc;
    }

    const credentials = Buffer.from(token, 'base64').toString('utf8');

    if (!credentials.includes(':')) {
      const exc = new InvalidClientException('Missing Semicolon Separator.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client provided an invalid Basic Token`,
        'b3dc9148-eaad-468d-b9a5-706f8933dc31',
        null,
        exc,
      );

      throw exc;
    }

    const [clientId, clientSecret] = credentials.split(':', 2);

    if (typeof clientId === 'undefined' || clientId === '') {
      const exc = new InvalidClientException('Missing Client Identifier.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client did not provide a Client Identifier`,
        '7bcee623-ce9b-456c-a4c3-608494b4ccb4',
        null,
        exc,
      );

      throw exc;
    }

    if (typeof clientSecret === 'undefined' || clientSecret === '') {
      const exc = new InvalidClientException('Missing Client Secret.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client did not provide a Client Secret`,
        '73c5d63d-6969-4b25-94a9-2487d2f913ab',
        null,
        exc,
      );

      throw exc;
    }

    this.logger.debug(
      `[${this.constructor.name}] Searching for a Client with the provided Identifier`,
      '56b81c2b-83b0-4507-a1a4-dd82830ccdbc',
      { id: clientId },
    );

    const client = await this.clientService.findOne(clientId);

    if (client === null) {
      const exc = new InvalidClientException('Invalid Credentials.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] Could not find a Client with the provided Identifier`,
        'abe3e437-fd1c-467e-a0be-56a56ae23cf1',
        { id: clientId },
        exc,
      );

      throw exc;
    }

    if (client.secret === null) {
      const exc = new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`,
      ).setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client does not have a Secret`,
        'e1da0e7e-3c1f-4c35-9176-a8e81f766389',
        { client },
        exc,
      );

      throw exc;
    }

    const expectedClientSecret = Buffer.from(client.secret, 'utf8');
    const receivedClientSecret = Buffer.from(clientSecret, 'utf8');

    if (expectedClientSecret.length !== receivedClientSecret.length) {
      const exc = new InvalidClientException('Invalid Credentials.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client provided a mismatching Secret`,
        '47203509-2d7b-4f90-a106-dda85a56f4db',
        { client },
        exc,
      );

      throw exc;
    }

    if (!timingSafeEqual(expectedClientSecret, receivedClientSecret)) {
      const exc = new InvalidClientException('Invalid Credentials.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client provided a mismatching Secret`,
        '4e0b5dba-e9fe-4ad0-bcd2-a58b5570e77c',
        { client },
        exc,
      );

      throw exc;
    }

    if (client.secretExpiresAt !== null && new Date() >= client.secretExpiresAt) {
      const exc = new InvalidClientException('Invalid Credentials.').setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Secret of the Client expired`,
        '7acc557d-c955-4beb-abac-a8e3b9b2c580',
        { client },
        exc,
      );

      throw exc;
    }

    if (client.authenticationMethod !== this.name) {
      const exc = new InvalidClientException(
        `This Client is not allowed to use the Authentication Method "${this.name}".`,
      ).setHeaders(this.headers);

      this.logger.error(
        `[${this.constructor.name}] The Client is not allowed to use the Authentication Method "${this.name}"`,
        'd1434c29-e2ff-4d65-8af6-3c52e7ccbe32',
        { client },
        exc,
      );

      throw exc;
    }

    this.logger.debug(`[${this.constructor.name}] Completed authenticate()`, '7776d17f-926e-4e29-be9c-ad3484ec961b', {
      request,
      client,
    });

    return client;
  }
}
