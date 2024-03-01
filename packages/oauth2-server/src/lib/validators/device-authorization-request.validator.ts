import { Injectable } from '@guarani/di';

import { DeviceAuthorizationContext } from '../context/device-authorization-context';
import { Client } from '../entities/client.entity';
import { ClientAuthenticationHandler } from '../handlers/client-authentication.handler';
import { ScopeHandler } from '../handlers/scope.handler';
import { HttpRequest } from '../http/http.request';
import { Logger } from '../logger/logger';
import { DeviceAuthorizationRequest } from '../requests/device-authorization-request';

/**
 * Implementation of the Device Authorization Request Validator.
 */
@Injectable()
export class DeviceAuthorizationRequestValidator {
  /**
   * Instantiates a new Device Authorization Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    private readonly scopeHandler: ScopeHandler,
  ) {}

  /**
   * Validates the Http Device Authorization Request and returns the actors of the Device Authorization Context.
   *
   * @param request Http Request.
   * @returns Device Authorization Context.
   */
  public async validate(request: HttpRequest): Promise<DeviceAuthorizationContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '745845da-4437-4d7d-8e2e-8f3b863fc152', {
      request,
    });

    const parameters = request.form<DeviceAuthorizationRequest>();

    const client = await this.clientAuthenticationHandler.authenticate(request);
    const scopes = this.getScopes(client, parameters);

    const context: DeviceAuthorizationContext = { parameters, client, scopes };

    this.logger.debug(
      `[${this.constructor.name}] Device Authorization Request validation completed`,
      'ce0250c1-0a05-49b4-83bb-769a1a2a88b9',
      { context },
    );

    return context;
  }

  /**
   * Checks if the provided scope is supported by the Authorization Server and if the Client is allowed to request it.
   *
   * @param client Client of the Request.
   * @param scope Scope requested by the Client.
   */
  private getScopes(client: Client, parameters: DeviceAuthorizationRequest): string[] {
    this.logger.debug(`[${this.constructor.name}] Called getScopes()`, '517547e7-fab1-4a03-89fb-daf71d6cf58e', {
      client,
      parameters,
    });

    this.scopeHandler.checkRequestedScope(parameters.scope ?? null);

    return this.scopeHandler.getAllowedScopes(client, parameters.scope ?? null);
  }
}
