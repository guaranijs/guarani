import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';

import { DeleteRegistrationContext } from '../../context/registration/delete.registration-context';
import { GetRegistrationContext } from '../../context/registration/get.registration-context';
import { AccessToken } from '../../entities/access-token.entity';
import { InsufficientScopeException } from '../../exceptions/insufficient-scope.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { InvalidTokenException } from '../../exceptions/invalid-token.exception';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { HttpRequest } from '../../http/http.request';
import { Logger } from '../../logger/logger';
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
   * @param logger Logger of the Authorization Server.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    protected readonly logger: Logger,
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
    this.logger.debug(`[${this.constructor.name}] Called validate()`, '1e0f83af-4f03-4a08-8dbd-95b2662bbe9a', {
      request,
    });

    const parameters = <GetRegistrationRequest | DeleteRegistrationRequest>request.query;

    const clientId = this.getClientId(parameters);
    const accessToken = await this.authorize(request, clientId, this.expectedScopes);

    const context = <TContext>{ parameters, accessToken, client: accessToken.client! };

    const method = request.method.charAt(0) + request.method.slice(1).toLowerCase();

    this.logger.debug(
      `[${this.constructor.name}] ${method} Registration Request validation completed`,
      '8be92bc7-a369-4c8e-8249-b45e2f4d1931',
      { context },
    );

    return context;
  }

  /**
   * Checks and returns the Identifier of the Client of the Request.
   *
   * @param parameters Parameters of the Dynamic Client Registration Request.
   * @returns Identifier of the Client of the Request.
   */
  private getClientId(parameters: GetRegistrationRequest | DeleteRegistrationRequest): string {
    this.logger.debug(`[${this.constructor.name}] Called getClientId()`, '23da499c-607c-43ea-b892-ce6261c16018', {
      parameters,
    });

    if (typeof parameters.client_id === 'undefined') {
      const exc = new InvalidRequestException('Invalid parameter "client_id".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "client_id"`,
        '7483bce0-dc3d-4f90-9834-8f71b7a7714c',
        { parameters },
        exc,
      );

      throw exc;
    }

    return parameters.client_id;
  }

  /**
   * Retrieves the Access Token from the Request and validates it.
   *
   * @param request Http Request.
   * @param clientId Identifier of the Client of the Request.
   * @param scopes Expected Scopes for the Request.
   * @returns Access Token based on the Identifier provided by the Client.
   */
  private async authorize(request: HttpRequest, clientId: string, scopes: string[]): Promise<AccessToken> {
    this.logger.debug(`[${this.constructor.name}] Called authorize()`, '4568ca16-1cc1-4fc9-a949-ea10b16e4cd6', {
      request,
      client_id: clientId,
      scopes,
    });

    const accessToken = await this.clientAuthorizationHandler.authorize(request);

    if (accessToken.client === null) {
      const exc = new InvalidTokenException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] Cannot use a Registration Access Token`,
        '83b83dd2-a6bc-44c7-987a-1787b8947b2a',
        { access_token: accessToken.id },
        exc,
      );

      throw exc;
    }

    const clientIdentifier = Buffer.from(clientId, 'utf8');
    const accessTokenClientIdentifier = Buffer.from(accessToken.client!.id, 'utf8');

    if (
      clientIdentifier.length !== accessTokenClientIdentifier.length ||
      !timingSafeEqual(clientIdentifier, accessTokenClientIdentifier)
    ) {
      await this.accessTokenService.revoke(accessToken);
      const exc = new InsufficientScopeException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use an Access Token not issued to itself`,
        'df86545a-b926-4c59-99f8-df8b6479095d',
        { client_id: clientId, access_token: accessToken.id },
        exc,
      );

      throw exc;
    }

    if (accessToken.scopes.every((scope) => !scopes.includes(scope))) {
      const exc = new InsufficientScopeException('Invalid Credentials.');

      this.logger.error(
        `[${this.constructor.name}] The Client tried to use an Access Token without the required scope`,
        'b53318f2-401a-49a9-bb7d-db6ec3141007',
        { client_id: clientId, access_token: accessToken.id },
        exc,
      );

      throw exc;
    }

    return accessToken;
  }
}
