import { Inject, Injectable } from '@guarani/di';
import { isPlainObject } from '@guarani/primitives';

import { PostRegistrationContext } from '../../context/registration/post.registration-context';
import { AccessToken } from '../../entities/access-token.entity';
import { InsufficientScopeException } from '../../exceptions/insufficient-scope.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../../exceptions/invalid-token.exception';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { ScopeHandler } from '../../handlers/scope.handler';
import { HttpRequest } from '../../http/http.request';
import { HttpMethod } from '../../http/http-method.type';
import { Logger } from '../../logger/logger';
import { PostRegistrationRequest } from '../../requests/registration/post.registration-request';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../../services/access-token.service.token';
import { Settings } from '../../settings/settings';
import { SETTINGS } from '../../settings/settings.token';
import { PostAndPutRegistrationRequestValidator } from './post-and-put.registration-request.validator';

/**
 * Implementation of the Post Registration Request Validator.
 */
@Injectable()
export class PostRegistrationRequestValidator extends PostAndPutRegistrationRequestValidator<PostRegistrationContext> {
  /**
   * Http Method that uses this validator.
   */
  public readonly httpMethod: HttpMethod = 'POST';

  /**
   * Scopes that grant access to the Post Client Registration Request.
   */
  public readonly expectedScopes: string[] = ['client:manage', 'client:create'];

  /**
   * Instantiates a new Post Registration Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param scopeHandler Instance of the Scope Handler.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly scopeHandler: ScopeHandler,
    protected override readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    @Inject(ACCESS_TOKEN_SERVICE) protected override readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(SETTINGS) protected override readonly settings: Settings,
  ) {
    super(logger, scopeHandler, clientAuthorizationHandler, accessTokenService, settings);
  }

  /**
   * Validates the Registration Request and returns the actors of the Registration Context.
   *
   * @param request Http Request.
   * @returns Dynamic Client Registration Context.
   */
  public override async validate(request: HttpRequest): Promise<PostRegistrationContext> {
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '7cb54240-a380-4fe1-b3fe-2ebca642bba3', {
      request,
    });

    const parameters = request.json<PostRegistrationRequest>();

    if (!isPlainObject(parameters)) {
      const exc = new InvalidRequestException('Invalid Http Request Body.');

      this.logger.error(
        `[${this.constructor.name}] Invalid Http Request Body`,
        '86bb81db-6ec9-4ee2-a0d6-c98eb9171bbc',
        null,
        exc,
      );

      throw exc;
    }

    const accessToken = await this.authorize(request);

    const context = await super.validate(request);

    Object.assign<PostRegistrationContext, Partial<PostRegistrationContext>>(context, {
      parameters,
      accessToken,
    });

    this.logger.debug(
      `[${this.constructor.name}] Post Registration Request validation completed`,
      '1d216b8a-73a8-4780-bbda-1d662c69962b',
      { context },
    );

    return context;
  }

  /**
   * Retrieves the Access Token from the Request and validates it.
   *
   * @param request Http Request.
   * @returns Access Token based on the handle provided by the Client.
   */
  private async authorize(request: HttpRequest): Promise<AccessToken> {
    this.logger.debug(`[${this.constructor.name}] Called authorize()`, '24cab351-68a0-4541-8145-5596d21e0ae5', {
      request,
    });

    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (accessToken.client !== null) {
      const exc = new InvalidTokenException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Must use a Registration Access Token`,
        'bec463ca-4299-49fc-ada5-90e880f17334',
        { access_token: accessToken.handle },
        exc,
      );

      throw exc;
    }

    if (accessToken.scopes.every((scope) => !this.expectedScopes.includes(scope))) {
      const exc = new InsufficientScopeException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use an Access Token without the required scope`,
        '3ccc3744-c98a-4d12-807f-c2f66fc38a34',
        { access_token: accessToken.handle },
        exc,
      );

      throw exc;
    }

    return accessToken;
  }
}
