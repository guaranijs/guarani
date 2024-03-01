import { Injectable, InjectAll } from '@guarani/di';

import { ClientCredentialsTokenContext } from '../../context/token/client-credentials.token-context';
import { Client } from '../../entities/client.entity';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { ClientCredentialsTokenRequest } from '../../requests/token/client-credentials.token-request';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **Client Credentials** Token Request Validator.
 */
@Injectable()
export class ClientCredentialsTokenRequestValidator extends TokenRequestValidator<ClientCredentialsTokenContext> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'client_credentials';

  /**
   * Instantiates a new Client Credentials Token Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    private readonly scopeHandler: ScopeHandler,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[],
  ) {
    super(logger, clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<ClientCredentialsTokenContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '2ce4be3d-e01c-41a4-af20-55358475fdd9', {
      request,
    });

    const context = await super.validate(request);

    const { parameters } = context;

    const scopes = this.getScopes(parameters, context.client);

    Object.assign<ClientCredentialsTokenContext, Partial<ClientCredentialsTokenContext>>(context, { scopes });

    this.logger.debug(
      `[${this.constructor.name}] Client Credentials Token Request validation completed`,
      '7fa22ce8-70d9-4b5a-837e-122b8fecaf12',
      { context },
    );

    return context;
  }

  /**
   * Checks if the provided scope is supported by the Authorization Server and if the Client is allowed to request it,
   * then return the granted scopes for further processing.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Scopes granted to the Client.
   */
  protected getScopes(parameters: ClientCredentialsTokenRequest, client: Client): string[] {
    this.logger.debug(`[${this.constructor.name}] Called getScopes()`, 'f1f26e92-8f62-46cc-a01c-74eaf17623cc', {
      parameters,
      client,
    });

    this.scopeHandler.checkRequestedScope(parameters.scope ?? null);

    return this.scopeHandler.getAllowedScopes(client, parameters.scope ?? null);
  }
}
