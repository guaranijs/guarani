import { timingSafeEqual } from 'crypto';

import { DeleteRegistrationContext } from '../../context/registration/delete.registration-context';
import { GetRegistrationContext } from '../../context/registration/get.registration-context';
import { AccessToken } from '../../entities/access-token.entity';
import { InsufficientScopeException } from '../../exceptions/insufficient-scope.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../../exceptions/invalid-token.exception';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { HttpRequest } from '../../http/http.request';
import { DeleteRegistrationRequest } from '../../requests/registration/delete.registration-request';
import { GetRegistrationRequest } from '../../requests/registration/get.registration-request';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { RegistrationRequestValidator } from './registration-request.validator';

/**
 * Abstract Base Class of the Get and Delete Registration Request Validators.
 */
export abstract class GetAndDeleteRegistrationRequestValidator<
  TContext extends GetRegistrationContext | DeleteRegistrationContext =
    | GetRegistrationContext
    | DeleteRegistrationContext,
> extends RegistrationRequestValidator<TContext> {
  /**
   * Instantiates a new Dynamic Registration Request Validator.
   *
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    protected readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    protected readonly accessTokenService: AccessTokenServiceInterface,
  ) {
    super();
  }

  /**
   * Validates the Registration Request and returns the actors of the Registration Context.
   *
   * @param request Http Request.
   * @returns Dynamic Client Registration Context.
   */
  public async validate(request: HttpRequest): Promise<TContext> {
    const parameters = request.query as GetRegistrationRequest | DeleteRegistrationRequest;

    const clientId = this.getClientId(parameters);
    const accessToken = await this.authorize(request, clientId, this.expectedScopes);

    return { parameters, accessToken, client: accessToken.client! } as TContext;
  }

  /**
   * Checks and returns the Identifier of the Client of the Request.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Identifier of the Client of the Request.
   */
  private getClientId(parameters: GetRegistrationRequest | DeleteRegistrationRequest): string {
    if (typeof parameters.client_id === 'undefined') {
      throw new InvalidRequestException('Invalid parameter "client_id".');
    }

    return parameters.client_id;
  }

  /**
   * Retrieves the Access Token from the Request and validates it.
   *
   * @param request Http Request.
   * @param clientId Identifier of the Client of the Request.
   * @param scopes Expected Scopes for the Request.
   * @returns Access Token based on the handle provided by the Client.
   */
  private async authorize(request: HttpRequest, clientId: string, scopes: string[]): Promise<AccessToken> {
    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (accessToken.client === null) {
      throw new InvalidTokenException('Invalid Credentials.');
    }

    const clientIdentifier = Buffer.from(clientId, 'utf8');
    const accessTokenClientIdentifier = Buffer.from(accessToken.client!.id, 'utf8');

    if (
      clientIdentifier.length !== accessTokenClientIdentifier.length ||
      !timingSafeEqual(clientIdentifier, accessTokenClientIdentifier)
    ) {
      await this.accessTokenService.revoke(accessToken);
      throw new InsufficientScopeException('Invalid Credentials.');
    }

    if (accessToken.scopes.every((scope) => !scopes.includes(scope))) {
      throw new InsufficientScopeException('Invalid Credentials.');
    }

    return accessToken;
  }
}
