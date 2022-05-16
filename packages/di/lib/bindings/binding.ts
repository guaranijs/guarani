import { Optional } from '@guarani/types';

import { InjectableToken } from '../injectable-token';
import { Lifecycle } from '../lifecycle';
import { Provider } from '../providers/provider';

/**
 * Binding representing the relationship between a Token and a Provider.
 */
export class Binding<T> {
  /**
   * Injectable Token of the dependency.
   */
  public readonly token: InjectableToken<T>;

  /**
   * Provider containing the method used to resolve the dependency.
   */
  public provider!: Provider<T>;

  /**
   * Resolution scope of the dependency.
   */
  public lifecycle: Lifecycle = Lifecycle.Transient;

  /**
   * Resolved Singleton instance of the Token.
   */
  public singleton?: Optional<T>;

  /**
   * Instantiates a new Binding of the DI Container.
   *
   * @param token Injectable Token of the dependency.
   */
  public constructor(token: InjectableToken<T>) {
    this.token = token;
  }
}
