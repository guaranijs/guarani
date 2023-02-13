import { Provider } from '../providers/provider';
import { InjectableToken } from '../types/injectable-token.type';
import { Lifecycle } from '../types/lifecycle.enum';

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
  public lifecycle: Lifecycle = Lifecycle.Singleton;

  /**
   * Resolved Singleton instance of the Token.
   */
  public singleton?: T;

  /**
   * Instantiates a new Binding of the Dependency Injection Container.
   *
   * @param token Injectable Token of the dependency.
   */
  public constructor(token: InjectableToken<T>) {
    this.token = token;
  }
}
