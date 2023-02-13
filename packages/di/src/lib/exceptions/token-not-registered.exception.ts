import { InjectableToken } from '../types/injectable-token.type';
import { DependencyInjectionException } from './dependency-injection.exception';

/**
 * Thrown when a Token is not registered at the Dependency Injection Container.
 */
export class TokenNotRegisteredException<T> extends DependencyInjectionException {
  /**
   * Thrown when the provided Token is not registered at the Dependency Injection Container.
   *
   * @param token Token not registered in the Dependency Injection Container.
   */
  public constructor(token: InjectableToken<T>) {
    const tokenName = typeof token === 'function' ? token.name : String(token);
    const message = `The Token "${tokenName}" is not registered.`;

    super(message);
  }
}
