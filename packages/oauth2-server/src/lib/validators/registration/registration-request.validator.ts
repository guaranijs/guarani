import { HttpRequest } from '../../http/http.request';
import { HttpMethod } from '../../http/http-method.type';

/**
 * Abstract Base Class of the Dynamic Client Registration Request Validators.
 */
export abstract class RegistrationRequestValidator<TContext = unknown> {
  /**
   * Http Method that uses this validator.
   */
  public abstract readonly httpMethod: HttpMethod;

  /**
   * Scopes that grant access to the Dynamic Client Registration Request.
   */
  public abstract readonly expectedScopes: string[];

  /**
   * Validates the Dynamic Client Registration Request and returns the actors of the Dynamic Client Registration Context.
   *
   * @param request Http Request.
   * @returns Dynamic Client Registration Context.
   */
  public abstract validate(request: HttpRequest): Promise<TContext>;
}
