import { Lifecycle } from '../lifecycle';
import { Binding } from './binding';

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
   * Singletons always resolve to the same unique instance.
   */
  public asSingleton(): void {
    this.binding.lifecycle = Lifecycle.Singleton;
  }

  /**
   * Defines the Lifecycle of the Binding as **Request**.
   *
   * All resolutions of the Token in a single Resolution Chain will use the same instance.
   */
  public asRequest(): void {
    this.binding.lifecycle = Lifecycle.Request;
  }

  /**
   * Defines the Lifecycle of the Binding as **Transient**.
   *
   * Transient Tokens always resolve a new instance.
   */
  public asTransient(): void {
    this.binding.lifecycle = Lifecycle.Transient;
  }
}
