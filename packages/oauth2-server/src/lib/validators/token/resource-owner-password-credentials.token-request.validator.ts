import { Inject, Injectable, InjectAll } from '@guarani/di';

import { ResourceOwnerPasswordCredentialsTokenContext } from '../../context/token/resource-owner-password-credentials.token.context';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../../requests/token/resource-owner-password-credentials.token-request';
import { UserServiceInterface } from '../../services/user.service.interface';
import { USER_SERVICE } from '../../services/user.service.token';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **Resource Owner Password Credentials** Token Request Validator.
 */
@Injectable()
export class ResourceOwnerPasswordCredentialsTokenRequestValidator extends TokenRequestValidator<
  ResourceOwnerPasswordCredentialsTokenRequest,
  ResourceOwnerPasswordCredentialsTokenContext
> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'password';

  /**
   * Instantiates a new Resource Owner Password Credentials Token Request Validator.
   *
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   * @param userService Instance of the User Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    protected readonly scopeHandler: ScopeHandler,
    @Inject(USER_SERVICE) protected readonly userService: UserServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[]
  ) {
    super(clientAuthenticationHandler, grantTypes);

    if (typeof this.userService.findByResourceOwnerCredentials !== 'function') {
      throw new TypeError(
        'Missing implementation of required method "UserServiceInterface.findByResourceOwnerCredentials".'
      );
    }
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<ResourceOwnerPasswordCredentialsTokenContext> {
    const parameters = <ResourceOwnerPasswordCredentialsTokenRequest>request.body;

    const context = await super.validate(request);

    const user = await this.getUser(parameters);
    const scopes = this.getScopes(parameters, context.client);

    return { ...context, user, scopes };
  }

  /**
   * Searches a User from the application's storage based on the provided username and password.
   *
   * @param parameters Parameters of the Token Request.
   * @returns User that matches the provided Credentials.
   */
  private async getUser(parameters: ResourceOwnerPasswordCredentialsTokenRequest): Promise<User> {
    if (typeof parameters.username !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "username".' });
    }

    if (typeof parameters.password !== 'string') {
      throw new InvalidRequestException({ description: 'Invalid parameter "password".' });
    }

    const user = await this.userService.findByResourceOwnerCredentials!(parameters.username, parameters.password);

    if (user === null) {
      throw new InvalidGrantException({ description: 'Invalid Credentials.' });
    }

    return user;
  }

  /**
   * Checks if the provided scope is supported by the Authorization Server and if the Client is allowed to request it,
   * then return the granted scopes for further processing.
   *
   * @param parameters Parameters of the Token Request.
   * @param client Client of the Request.
   * @returns Scopes granted to the Client.
   */
  protected getScopes(parameters: ResourceOwnerPasswordCredentialsTokenRequest, client: Client): string[] {
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
