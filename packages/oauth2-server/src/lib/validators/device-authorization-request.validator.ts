import { Injectable } from '@guarani/di';

import { DeviceAuthorizationContext } from '../context/device-authorization.context';
import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpRequest } from '../http/http.request';
import { DeviceAuthorizationRequest } from '../requests/device-authorization-request';

/**
 * Implementation of the Device Authorization Request Validator.
 */
@Injectable()
export class DeviceAuthorizationRequestValidator {
  /**
   * Instantiates a new Device Authorization Request Validator.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   */
  public constructor(
    private readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    private readonly scopeHandler: ScopeHandler
  ) {}

  /**
   * Validates the Http Device Authorization Request and returns the actors of the Device Authorization Context.
   *
   * @param request Http Request.
   * @returns Device Authorization Context.
   */
  public async validate(request: HttpRequest<DeviceAuthorizationRequest>): Promise<DeviceAuthorizationContext> {
    const { data: parameters } = request;

    const client = await this.clientAuthenticationHandler.authenticate(request);
    const scopes = this.getScopes(client, parameters.scope);

    return { parameters, client, scopes };
  }

  /**
   * Checks if the provided scope is supported by the Authorization Server and if the Client is allowed to request it.
   *
   * @param client Client of the Request.
   * @param scope Scope requested by the Client.
   */
  private getScopes(client: Client, scope: string | undefined): string[] {
    this.scopeHandler.checkRequestedScope(scope);

    scope?.split(' ').forEach((requestedScope) => {
      if (!client.scopes.includes(requestedScope)) {
        throw new AccessDeniedException({
          description: `The Client is not allowed to request the scope "${requestedScope}".`,
        });
      }
    });

    return this.scopeHandler.getAllowedScopes(client, scope);
  }
}
