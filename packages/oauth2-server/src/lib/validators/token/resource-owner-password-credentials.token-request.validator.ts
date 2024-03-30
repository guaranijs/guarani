import { Inject, Injectable, InjectAll } from '@guarani/di';

import { ResourceOwnerPasswordCredentialsTokenContext } from '../../context/token/resource-owner-password-credentials.token-context';
import { Client } from '../../entities/client.entity';
import { User } from '../../entities/user.entity';
import { InvalidGrantException } from '../../exceptions/invalid-grant.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { GrantTypeInterface } from '../../grant-types/grant-type.interface';
import { GRANT_TYPE } from '../../grant-types/grant-type.token';
import { GrantType } from '../../grant-types/grant-type.type';
import { ClientAuthenticationHandler } from '../../handlers/client-authentication.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
import { ResourceOwnerPasswordCredentialsTokenRequest } from '../../requests/token/resource-owner-password-credentials.token-request';
import { UserServiceInterface } from '../../services/user.service.interface';
import { USER_SERVICE } from '../../services/user.service.token';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Implementation of the **Resource Owner Password Credentials** Token Request Validator.
 */
@Injectable()
export class ResourceOwnerPasswordCredentialsTokenRequestValidator extends TokenRequestValidator<ResourceOwnerPasswordCredentialsTokenContext> {
  /**
   * Name of the Grant Type that uses this Validator.
   */
  public readonly name: GrantType = 'password';

  /**
   * Instantiates a new Resource Owner Password Credentials Token Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthenticationHandler Instance of the Client Authentication Handler.
   * @param scopeHandler Instance of the Scope Handler.
   * @param userService Instance of the User Service.
   * @param grantTypes Grant Types registered at the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly clientAuthenticationHandler: ClientAuthenticationHandler,
    private readonly scopeHandler: ScopeHandler,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
    @InjectAll(GRANT_TYPE) protected override readonly grantTypes: GrantTypeInterface[],
  ) {
    super(logger, clientAuthenticationHandler, grantTypes);

    if (typeof this.userService.findByResourceOwnerCredentials !== 'function') {
      const exc = new TypeError(
        'Missing implementation of required method "UserServiceInterface.findByResourceOwnerCredentials".',
      );

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "UserServiceInterface.findByResourceOwnerCredentials"`,
        'bc3a9749-5315-408f-a240-8e961480aa23',
        null,
        exc,
      );

      throw exc;
    }
  }

  /**
   * Validates the Http Token Request and returns the actors of the Token Context.
   *
   * @param request Http Request.
   * @returns Token Context.
   */
  public override async validate(request: HttpRequest): Promise<ResourceOwnerPasswordCredentialsTokenContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, 'f01f3984-9664-4a99-91ec-232f825d5e0a', {
      request,
    });

    const context = await super.validate(request);

    const { parameters } = context;

    const user = await this.getUser(parameters);
    const scopes = this.getScopes(parameters, context.client);

    Object.assign<ResourceOwnerPasswordCredentialsTokenContext, Partial<ResourceOwnerPasswordCredentialsTokenContext>>(
      context,
      { user, scopes },
    );

    this.logger.debug(
      `[${this.constructor.name}] Resource Owner Password Credentials Token Request validation completed`,
      'b1b7f89a-36bf-4c46-aa42-411812991114',
      { context },
    );

    return context;
  }

  /**
   * Searches a User from the application's storage based on the provided username and password.
   *
   * @param parameters Parameters of the Token Request.
   * @returns User that matches the provided Credentials.
   */
  private async getUser(parameters: ResourceOwnerPasswordCredentialsTokenRequest): Promise<User> {
    this.logger.debug(`[${this.constructor.name}] Called getUser()`, '0b4a7714-e3ed-4393-9246-e41a3550fee2', {
      parameters,
    });

    if (typeof parameters.username === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "username".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "username"`,
        '2963042c-77f5-4704-aeff-22f2618280b3',
        { parameters },
        exc,
      );

      throw exc;
    }

    if (typeof parameters.password === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "password".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "password"`,
        '55595e1d-8a32-43f4-8a02-ca2e72196b69',
        { parameters },
        exc,
      );

      throw exc;
    }

    const user = await this.userService.findByResourceOwnerCredentials!(parameters.username, parameters.password);

    if (user === null) {
      const exc = new InvalidGrantException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Credentials`,
        '2bb8e2bc-644f-480b-83a7-812a05c099a1',
        null,
        exc,
      );

      throw exc;
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
    this.logger.debug(`[${this.constructor.name}] Called getScopes()`, 'e1964d96-c65f-4caa-90aa-db238d1a70fd', {
      parameters,
      client,
    });

    this.scopeHandler.checkRequestedScope(parameters.scope ?? null);

    return this.scopeHandler.getAllowedScopes(client, parameters.scope ?? null);
  }
}
