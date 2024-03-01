import { Injectable, InjectAll } from '@guarani/di';

import { ClientAuthenticationInterface } from '../client-authentication/client-authentication.interface';
import { CLIENT_AUTHENTICATION } from '../client-authentication/client-authentication.token';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';

/**
 * Handler used to authenticate the Client of the OAuth 2.0 Request.
 */
@Injectable()
export class ClientAuthenticationHandler {
  /**
   * Instantiates a new Client Authentication Handler.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationMethods Client Authentication Methods supported by the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    @InjectAll(CLIENT_AUTHENTICATION) private readonly clientAuthenticationMethods: ClientAuthenticationInterface[],
  ) {}

  /**
   * Authenticates the Client based on the Client Authentication Methods supported by the Authorization Server.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    this.logger.debug(`[${this.constructor.name}] Called authenticate()`, '805321cd-d92f-4b94-aafb-ed1a751dc765', {
      request,
    });

    const methods = this.clientAuthenticationMethods.filter((method) => method.hasBeenRequested(request));

    if (methods.length === 0) {
      const exc = new InvalidClientException('No Client Authentication Method detected.');

      this.logger.error(
        `[${this.constructor.name}] No Client Authentication Method detected`,
        'be28dc5f-535a-4808-89fe-99781e4795da',
        null,
        exc,
      );

      throw exc;
    }

    if (methods.length > 1) {
      const exc = new InvalidClientException('Multiple Client Authentication Methods detected.');

      this.logger.error(
        `[${this.constructor.name}] Multiple Client Authentication Methods detected`,
        '9581a0f0-00c2-4bff-bae0-cdf2d39f5721',
        { methods: methods.map((method) => method.name) },
        exc,
      );

      throw exc;
    }

    const [method] = methods;

    return await method!.authenticate(request);
  }
}
