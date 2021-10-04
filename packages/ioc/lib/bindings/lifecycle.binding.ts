import { Lifecycle } from '../lifecycle'
import { Binding } from './binding'

/**
 * Binding Configuration used to define the Lifecycle of the Token.
 */
export class LifecycleBinding<T> {
  /**
   * Instantiates a wrapper to define the Lifecycle of the Binding.
   *
   * @param binding Binding to be configured.
   */
  public constructor(private readonly binding: Binding<T>) {}

  /**
   * Defines the Lifecycle of the Binding as **Singleton**.
   *
   * Singletons always resolve to the same instance.
   *
   * If the Token is not resolved, the Container resolves it and stores
   * the instance within the Binding.
   *
   * Subsequent calls to resolve the same token will return the previously
   * resolved instance cached at the Binding.
   */
  public asSingleton(): void {
    this.binding.lifecycle = Lifecycle.Singleton
  }

  /**
   * Defines the Lifecycle of the Binding as **Transient**.
   *
   * Transient Tokens always resolve a new instance.
   */
  public asTransient(): void {
    this.binding.lifecycle = Lifecycle.Transient
  }
}
