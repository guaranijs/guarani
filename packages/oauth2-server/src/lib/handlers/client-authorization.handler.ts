import { Injectable, InjectAll } from '@guarani/di';

import { ClientAuthorizationInterface } from '../client-authorization/client-authorization.interface';
import { CLIENT_AUTHORIZATION } from '../client-authorization/client-authorization.token';
import { AccessToken } from '../entities/access-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';

/**
 * Handler used to authorize the Client of the OAuth 2.0 Request.
 */
@Injectable()
export class ClientAuthorizationHandler {
  /**
   * Instantiates a new Client Authorization Handler.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthorizationMethods Client Authorization Methods supported by the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    @InjectAll(CLIENT_AUTHORIZATION) private readonly clientAuthorizationMethods: ClientAuthorizationInterface[],
  ) {}

  /**
   * Authorizes the Client based on the Client Authorization Methods supported by the Authorization Server.
   *
   * @param request Http Request.
   * @returns Access Token provided by the Client.
   */
  public async authorize(request: HttpRequest): Promise<AccessToken> {
    this.logger.debug(`[${this.constructor.name}] Called authorize()`, 'aed72ec3-52d3-4834-a689-e16e3a90e01c', {
      request,
    });

    const methods = this.clientAuthorizationMethods.filter((method) => method.hasBeenRequested(request));

    if (methods.length === 0) {
      const exc = new InvalidRequestException('No Client Authorization Method detected.');

      this.logger.error(
        `[${this.constructor.name}] No Client Authorization Method detected`,
        '7c273447-a5b6-47f8-bb1e-dde997bd0a4b',
        null,
        exc,
      );

      throw exc;
    }

    if (methods.length > 1) {
      const exc = new InvalidRequestException('Multiple Client Authorization Methods detected.');

      this.logger.error(
        `[${this.constructor.name}] Multiple Client Authorization Methods detected`,
        'ed694a02-77d2-458c-81fd-43c6dcb1d3a4',
        { methods: methods.map((method) => method.name) },
        exc,
      );

      throw exc;
    }

    const [method] = methods;

    return await method!.authorize(request);
  }
}
