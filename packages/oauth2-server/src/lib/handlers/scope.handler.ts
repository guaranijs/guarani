import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
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
   */
  public checkRequestedScope(scope: Nullable<string>): void {
    if (scope === null) {
      return;
    }

    scope.split(' ').forEach((requestedScope) => {
      if (!this.settings.scopes.includes(requestedScope)) {
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
  public getAllowedScopes(client: Client, scope: Nullable<string>): string[] {
    if (scope === null) {
      return client.scopes;
    }

    return scope.split(' ').map((requestedScope) => {
      if (!client.scopes.includes(requestedScope)) {
        throw new AccessDeniedException(`The Client is not allowed to request the scope "${requestedScope}".`);
      }

      return requestedScope;
    });
  }
}
