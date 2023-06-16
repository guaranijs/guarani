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
   * @param scopeHandler Instance of the Scope Handler.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   * @param settings Settings of the Authorization Server.
   */
  public constructor(
    protected override readonly scopeHandler: ScopeHandler,
    protected override readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    @Inject(ACCESS_TOKEN_SERVICE) protected override readonly accessTokenService: AccessTokenServiceInterface,
    @Inject(SETTINGS) protected override readonly settings: Settings
  ) {
    super(scopeHandler, clientAuthorizationHandler, accessTokenService, settings);
  }

  /**
   * Validates the Registration Request and returns the actors of the Registration Context.
   *
   * @param request Http Request.
   * @returns Dynamic Client Registration Context.
   */
  public override async validate(request: HttpRequest): Promise<PostRegistrationContext> {
    const parameters = request.json<PostRegistrationRequest>();

    if (!isPlainObject(parameters)) {
      throw new InvalidRequestException('Invalid Http Request Body.');
    }

    const accessToken = await this.authorize(request);

    const context = await super.validate(request);

    return Object.assign<PostRegistrationContext, Partial<PostRegistrationContext>>(context, {
      parameters,
      accessToken,
    }) as PostRegistrationContext;
  }

  /**
   * Retrieves the Access Token from the Request and validates it.
   *
   * @param request Http Request.
   * @returns Access Token based on the handle provided by the Client.
   */
  private async authorize(request: HttpRequest): Promise<AccessToken> {
    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (accessToken.client !== null) {
      throw new InvalidTokenException('Invalid Credentials.');
    }

    if (accessToken.scopes.every((scope) => !this.expectedScopes.includes(scope))) {
      throw new InsufficientScopeException('Invalid Credentials.');
    }

    return accessToken;
  }
}
