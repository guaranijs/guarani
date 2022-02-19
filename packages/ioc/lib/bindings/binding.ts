import { Optional } from '@guarani/types';

import { Lifecycle } from '../lifecycle/lifecycle';
import { isProvider, Provider } from '../providers/provider';
import { InjectableToken } from '../tokens';

/**
 * Binding representing the relationship between a Token and a Provider.
 */
export class Binding<T> {
  /**
   * Token indexing the Binding.
   */
  private readonly _token: InjectableToken<T>;

  /**
   * Provider indexed at the Binding, used to resolve the Token.
   */
  private _provider!: Provider<T>;

  /**
   * Singleton instance of the Binding.
   */
  public instance?: Optional<T>;

  /**
   * Lifecycle of the Binding.
   */
  public lifecycle: Lifecycle = Lifecycle.Transient;

  /**
   * Creates a new Binding based on the provided Injectable Token.
   *
   * @param token Injectable Token to be defined.
   */
  public constructor(token: InjectableToken<T>) {
    this._token = token;
  }

  /**
   * Token indexing the Binding.
   */
  public get token(): InjectableToken<T> {
    return this._token;
  }

  /**
   * Provider indexed at the Binding, used to resolve the Token.
   */
  public get provider(): Provider<T> {
    return this._provider;
  }

  /**
   * Provider indexed at the Binding, used to resolve the Token.
   */
  public set provider(provider: Provider<T>) {
    if (this._provider === undefined && isProvider<T>(provider)) {
      this._provider = provider;
    }
  }
}
