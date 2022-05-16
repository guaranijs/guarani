import { Optional } from '@guarani/types';

import { InjectableToken } from '../injectable-token';
import { DependencyInjectionException } from './dependency-injection.exception';

/**
 * Thrown when a Token is not registered at the Dependency Injection Container.
 */
export class TokenNotRegisteredException<T = any> extends DependencyInjectionException {
  /**
   * Thrown when the provided Token is not registered at the Dependency Injection Container.
   *
   * @param token Token not registered in the Dependency Injection Container.
   * @param originalError Rethrown Error.
   */
  public constructor(token: InjectableToken<T>, originalError?: Optional<Error>) {
    const tokenName = typeof token === 'function' ? token.name : String(token);
    const message = `The Token "${tokenName}" is not registered.`;

    if (originalError === undefined) {
      super(message);
    } else {
      super(message, originalError);
    }
  }
}
