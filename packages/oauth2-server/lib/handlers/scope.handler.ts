import { Inject, Injectable } from '@guarani/di';
import { Optional } from '@guarani/types';

import { AuthorizationServerOptions } from '../authorization-server/options/authorization-server.options';
import { Client } from '../entities/client';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';

/**
 * Handler used to aggregate the operations of the OAuth 2.0 Scope.
 */
@Injectable()
export class ScopeHandler {
  /**
   * Instantiates a new Scope Handler.
   *
   * @param authorizationServerOptions Configuration Parameters of the Authorization Server.
   */
  public constructor(
    @Inject('AuthorizationServerOptions') private readonly authorizationServerOptions: AuthorizationServerOptions
  ) {}

  /**
   * Checks if the scope requested by the Client is supported by the Authorization Server.
   *
   * @param scope Scope requested by the Client.
   */
  public checkRequestedScope(scope?: Optional<string>): void {
    if (scope === undefined) {
      return;
    }

    scope.split(' ').forEach((requestedScope) => {
      if (!this.authorizationServerOptions.scopes.includes(requestedScope)) {
        throw new InvalidScopeException(`Unsupported scope "${requestedScope}".`);
      }
    });
  }

  /**
   * Returns the scope that the Client is allowed to use.
   *
   * If the Client requested specific scopes, this method will return the ones it is allowed to use.
   * Otherwise, it will return all the scopes registered by the Client.
   *
   * @param client Client of the Request.
   * @param scope Scope requested by the Client.
   * @returns Scopes that the Client is allowed to use.
   */
  public getAllowedScopes(client: Client, scope?: Optional<string>): string[] {
    return scope !== undefined ? scope.split(' ').filter((scope) => client.scopes.includes(scope)) : client.scopes;
  }
}
