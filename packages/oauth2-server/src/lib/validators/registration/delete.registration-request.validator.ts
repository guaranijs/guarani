import { Inject, Injectable } from '@guarani/di';

import { DeleteRegistrationContext } from '../../context/registration/delete.registration-context';
import { ClientAuthorizationHandler } from '../../handlers/client-authorization.handler';
import { HttpMethod } from '../../http/http-method.type';
import { Logger } from '../../logger/logger';
import { AccessTokenServiceInterface } from '../../services/access-token.service.interface';
import { ACCESS_TOKEN_SERVICE } from '../../services/access-token.service.token';
import { GetAndDeleteRegistrationRequestValidator } from './get-and-delete.registration-request.validator';

/**
 * Implementation of the Delete Registration Request Validator.
 */
@Injectable()
export class DeleteRegistrationRequestValidator extends GetAndDeleteRegistrationRequestValidator<DeleteRegistrationContext> {
  /**
   * Http Method that uses this validator.
   */
  public readonly httpMethod: HttpMethod = 'DELETE';

  /**
   * Scopes that grant access to the Delete Client Registration Request.
   */
  public readonly expectedScopes: string[] = ['client:manage', 'client:delete'];

  /**
   * Instantiates a new Delete Registration Request Validator.
   *
   * @param logger Logger of the Authorization Server.
   * @param clientAuthorizationHandler Instance of the Client Authorization Handler.
   * @param accessTokenService Instance of the Access Token Service.
   */
  public constructor(
    protected override readonly logger: Logger,
    protected override readonly clientAuthorizationHandler: ClientAuthorizationHandler,
    @Inject(ACCESS_TOKEN_SERVICE) protected override readonly accessTokenService: AccessTokenServiceInterface,
  ) {
    super(logger, clientAuthorizationHandler, accessTokenService);
  }
}
