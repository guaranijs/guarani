import { Injectable, InjectAll } from '@guarani/di';

import { ClientAuthenticationInterface } from '../client-authentication/client-authentication.interface';
import { CLIENT_AUTHENTICATION } from '../client-authentication/client-authentication.token';
import { Client } from '../entities/client.entity';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';

/**
 * Handler used to authenticate the Client of the OAuth 2.0 Request.
 */
@Injectable()
export class ClientAuthenticationHandler {
  /**
   * Instantiates a new Client Authentication Handler.
   *
   * @param clientAuthenticationMethods Client Authentication Methods supported by the Authorization Server.
   */
  public constructor(
    @InjectAll(CLIENT_AUTHENTICATION) private readonly clientAuthenticationMethods: ClientAuthenticationInterface[]
  ) {}

  /**
   * Authenticates the Client based on the Client Authentication Methods supported by the Authorization Server.
   *
   * @param request Http Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    const methods = this.clientAuthenticationMethods.filter((method) => method.hasBeenRequested(request));

    if (methods.length === 0) {
      throw new InvalidClientException({ description: 'No Client Authentication Method detected.' });
    }

    if (methods.length > 1) {
      throw new InvalidClientException({ description: 'Multiple Client Authentication Methods detected.' });
    }

    const [method] = methods;

    return await method!.authenticate(request);
  }
}
