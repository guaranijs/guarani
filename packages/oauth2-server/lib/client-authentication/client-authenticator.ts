import { Injectable, InjectAll } from '@guarani/di';

import { Client } from '../entities/client';
import { InvalidClientException } from '../exceptions/invalid-client.exception';
import { HttpRequest } from '../http/http.request';
import { IClientAuthentication } from './client-authentication.interface';

/**
 * Handler used to authenticate the Client of the OAuth 2.0 Request.
 */
@Injectable()
export class ClientAuthenticator {
  /**
   * Instantiates a new Client Authenticator.
   *
   * @param clientAuthenticationMethods Client Authentication Methods supported by the Authorization Server.
   */
  public constructor(
    @InjectAll('ClientAuthentication') private readonly clientAuthenticationMethods: IClientAuthentication[]
  ) {}

  /**
   * Authenticates the Client based on the Client Authentication Methods supported by the Authorization Server.
   *
   * @param request HTTP Request.
   * @returns Authenticated Client.
   */
  public async authenticate(request: HttpRequest): Promise<Client> {
    const methods = this.clientAuthenticationMethods.filter((method) => method.hasBeenRequested(request));

    if (methods.length === 0) {
      throw new InvalidClientException('No Client Authentication Method detected.');
    }

    if (methods.length > 1) {
      throw new InvalidClientException('Multiple Client Authentication Methods detected.');
    }

    const [method] = methods;

    return await method.authenticate(request);
  }
}
