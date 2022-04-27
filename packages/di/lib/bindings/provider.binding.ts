import { Constructor } from '@guarani/types';

import { InjectableToken } from '../injectable-token';
import { FactoryFunction } from '../types/factory-function';
import { Binding } from './binding';
import { LifecycleBinding } from './lifecycle.binding';

/**
 * Binding Configuration used to define the Provider of the Token.
 */
export class ProviderBinding<T> {
  /**
   * Instantiates a wrapper to define the Provider of the Binding.
   *
   * @param binding Binding to be configured.
   */
  public constructor(private readonly binding: Binding<T>) {}

  /**
   * Binds a class constructor to the Token.
   *
   * @param target Class constructor to be bound to the Token.
   */
  public toClass(target: Constructor<T>): LifecycleBinding<T> {
    this.binding.provider = { useClass: target };
    return new LifecycleBinding(this.binding);
  }

  /**
   * Binds a factory to the Token.
   *
   * @param factory Factory to be bound to the Token.
   */
  public toFactory(factory: FactoryFunction<T>): void {
    this.binding.provider = { useFactory: factory };
  }

  /**
   * Defines an alias to the Token.
   *
   * @param token Token to be aliased.
   */
  public toToken(token: InjectableToken<T>): LifecycleBinding<T> {
    this.binding.provider = { useToken: token };
    return new LifecycleBinding(this.binding);
  }

  /**
   * Binds a value to the Token.
   *
   * @param value Value to be bound to the Token.
   */
  public toValue(value: T): void {
    this.binding.provider = { useValue: value };
  }

  /**
   * Binds a Constructor Token to itself.
   */
  public toSelf(): LifecycleBinding<T> {
    if (typeof this.binding.token !== 'function') {
      throw new TypeError(`The Token "${String(this.binding.token)}" is not a valid Constructor.`);
    }

    return this.toClass(this.binding.token);
  }
}
