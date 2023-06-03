import { Injectable, InjectAll } from '@guarani/di';

import { ClientCredentialsTokenContext } from '../../context/token/client-credentials.token-context';
import { Client } from '../../entities/client.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { ClientCredentialsTokenRequest } from '../../requests/token/client-credentials.token-request';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **Client Credentials** Token Request Validator.
 */
@Injectable()
export class ClientCredentialsTokenRequestValidator extends TokenRequestValidator<
  ClientCredentialsTokenRequest,
  ClientCredentialsTokenContext
> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'client_credentials';

  /**
   * Instantiates a new Client Credentials Token Request Validator.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    protected readonly scopeHandler: ScopeHandler,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[]
  ) {
    super(clientAuthenticationHandler, grantTypes);
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<ClientCredentialsTokenContext> {
    const parameters = <ClientCredentialsTokenRequest>request.body;

    const context = await super.validate(request);

    const scopes = this.getScopes(parameters, context.client);

    return { ...context, scopes };
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
    if (parameters.scope !== undefined && typeof parameters.scope !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "scope".' });
    }

    this.scopeHandler.checkRequestedScope(parameters.scope);

    if (parameters.scope !== undefined) {
      parameters.scope.split(' ').forEach((requestedScope) => {
        if (!client.scopes.includes(requestedScope)) {
          throw new AccessDeniedException({
            description: `The Client is not allowed to request the scope "${requestedScope}".`,
          });
        }
      });
    }

    return this.scopeHandler.getAllowedScopes(client, parameters.scope);
  }
}
