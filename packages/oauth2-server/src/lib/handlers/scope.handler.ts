import { Inject, Injectable } from '@guarani/di';

import { Client } from '../entities/client.entity';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';

/**
 * Handler used to aggregate the operations of the OAuth 2.0 Scope.
 */
@Injectable()
export class ScopeHandler {
  /**
   * Instantiates a new Scope Handler.
   *
   * @param settings Settings of the Authorization Server.
   */
  public constructor(@Inject(SETTINGS) private readonly settings: Settings) {}

  /**
   * Checks if the scope requested by the Client is supported by the Authorization Server.
   *
   * @param scope Scope requested by the Client.
   * @param state Client State prior to the Authorization Request.
   */
  public checkRequestedScope(scope?: string, state?: string): void {
    if (scope === undefined) {
      return;
    }

    scope.split(' ').forEach((requestedScope) => {
      if (!this.settings.scopes.includes(requestedScope)) {
        throw new InvalidScopeException({ description: `Unsupported scope "${requestedScope}".`, state });
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
  public getAllowedScopes(client: Client, scope?: string): string[] {
    return scope !== undefined ? scope.split(' ').filter((scope) => client.scopes.includes(scope)) : client.scopes;
  }
}
