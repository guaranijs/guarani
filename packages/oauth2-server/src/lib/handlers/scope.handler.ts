import { Inject, Injectable } from '@guarani/di';
import { Nullable } from '@guarani/types';

import { Client } from '../entities/client.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidScopeException } from '../exceptions/invalid-scope.exception';
import { Logger } from '../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
  ) {}

  /**
   * Checks if the scope requested by the Client is supported by the Authorization Server.
   *
   * @param scope Scope requested by the Client.
   */
  public checkRequestedScope(scope: Nullable<string>): void {
    this.logger.debug(
      `[${this.constructor.name}] Called checkRequestedScope()`,
      '92a01280-8253-4ae6-a0ec-15e9bfaa720f',
      { requested_scope: scope },
    );

    if (scope === null) {
      return;
    }

    scope.split(' ').forEach((requestedScope) => {
      if (!this.settings.scopes.includes(requestedScope)) {
        const exc = new InvalidScopeException(`Unsupported scope "${requestedScope}".`);

        this.logger.error(
          `[${this.constructor.name}] Unsupported scope "${requestedScope}"`,
          '572f1f77-cf6d-463e-9c87-7a81bd69b851',
          { scopes: this.settings.scopes, requested_scopes: scope.split(' ') },
          exc,
        );

        throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getAllowedScopes()`, '6f0da132-367c-4f7c-bf83-95a6fc655f28', {
      client,
      requested_scope: scope,
    });

    if (scope === null) {
      this.logger.debug(
        `[${this.constructor.name}] Completed getAllowedScopes()`,
        '0b453fad-5cfd-4003-aa6d-93bbd8a6f7f9',
        { allowed_scopes: client.scopes },
      );

      return client.scopes;
    }

    const allowedScopes = scope.split(' ').map((requestedScope) => {
      if (!client.scopes.includes(requestedScope)) {
        const exc = new AccessDeniedException(`The Client is not allowed to request the scope "${requestedScope}".`);

        this.logger.error(
          `[${this.constructor.name}] The Client is not allowed to request the scope "${requestedScope}"`,
          '345c0252-3622-460b-a940-9997c35fee38',
          { requested_scopes: scope.split(' '), client_scopes: client.scopes },
          exc,
        );

        throw exc;
      }

      return requestedScope;
    });

    this.logger.debug(
      `[${this.constructor.name}] Completed getAllowedScopes()`,
      '0ed273d8-04d3-40ac-b53b-5a8a00ba8034',
      { allowed_scopes: allowedScopes },
    );

    return allowedScopes;
  }
}
