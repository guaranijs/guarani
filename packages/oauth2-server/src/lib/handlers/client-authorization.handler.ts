import { Injectable, InjectAll } from '@guarani/di';

import { ClientAuthorizationInterface } from '../client-authorization/client-authorization.interface';
import { CLIENT_AUTHORIZATION } from '../client-authorization/client-authorization.token';
import { AccessToken } from '../entities/access-token.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { HttpRequest } from '../http/http.request';

/**
 * Handler used to authorize the Client of the OAuth 2.0 Request.
 */
@Injectable()
export class ClientAuthorizationHandler {
  /**
   * Instantiates a new Client Authorization Handler.
   *
   * @param clientAuthorizationMethods Client Authorization Methods supported by the Authorization Server.
   */
  public constructor(
    @InjectAll(CLIENT_AUTHORIZATION) private readonly clientAuthorizationMethods: ClientAuthorizationInterface[],
  ) {}

  /**
   * Authorizes the Client based on the Client Authorization Methods supported by the Authorization Server.
   *
   * @param request Http Request.
   * @returns Access Token provided by the Client.
   */
  public async authorize(request: HttpRequest): Promise<AccessToken> {
    const methods = this.clientAuthorizationMethods.filter((method) => method.hasBeenRequested(request));

    if (methods.length === 0) {
      throw new InvalidRequestException('No Client Authorization Method detected.');
    }

    if (methods.length > 1) {
      throw new InvalidRequestException('Multiple Client Authorization Methods detected.');
    }

    const [method] = methods;

    return await method!.authorize(request);
  }
}
