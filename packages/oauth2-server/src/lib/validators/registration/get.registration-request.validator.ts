import { Inject, Injectable } from '@guarani/di';

import { GetRegistrationContext } from '../../context/registration/get.registration-context';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { HttpMethod } from '../../http/http-method.type';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../../services/access-token.service.token';
import { GetAndDeleteRegistrationRequestValidator } from './get-and-delete.registration-request.validator';

/**
 * Implementation of the Get Registration Request Validator.
 */
@Injectable()
export class GetRegistrationRequestValidator extends GetAndDeleteRegistrationRequestValidator<GetRegistrationContext> {
  /**
   * Http Method that uses this validator.
   */
  public readonly httpMethod: HttpMethod = 'GET';

  /**
   * Scopes that grant access to the Get Client Registration Request.
   */
  public readonly expectedScopes: string[] = ['client:manage', 'client:read'];

  /**
   * Instantiates a new Get Registration Request Validator.
   *
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    protected override readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    @Inject(ACCESS_TOKEN_SERVICE) protected override readonly accessTokenService: AccessTokenServiceInterface
  ) {
    super(clientAuthorizationHandler, accessTokenService);
  }
}
