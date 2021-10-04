import { Constructor, Factory } from '@guarani/utils'

import {
  isClassProvider,
  isFactoryProvider,
  isProvider,
  isTokenProvider,
  isValueProvider,
  Provider
} from '../providers'
import { InjectableToken, isConstructorToken } from '../tokens'
import { Binding } from './binding'
import { LifecycleBinding } from './lifecycle.binding'

/**
 * Binding Configuration used to define the Provider bound to the Token.
 */
export class ProviderBinding<T> {
  /**
   * Instantiates a wrapper to define the Provider of the Binding.
   *
   * @param binding Binding to be configured.
   */
  public constructor(private readonly binding: Binding<T>) {}

  /**
   * Generic binding function for the Provider.
   *
   * @param provider Current Provider.
   */
  public to<U>(provider: Provider<U>): LifecycleBinding<T> {
    if (!isProvider<U>(provider)) {
      throw new TypeError(`Invalid format for provider: ${provider}.`)
    }

    if (isClassProvider<U>(provider)) {
      return this.toClass(provider.target)
    }

    if (isFactoryProvider<U>(provider)) {
      return this.toFactory(provider.factory)
    }

    if (isTokenProvider<U>(provider)) {
      return this.toToken(provider.token)
    }

    if (isValueProvider<U>(provider)) {
      return this.toValue(provider.value)
    }
  }

  /**
   * Binds a class to the Token.
   *
   * @param target Class to be bound to the Token.
   */
  public toClass<U>(target: Constructor<U>): LifecycleBinding<T> {
    this.binding.provider = { target: target as any }
    return new LifecycleBinding(this.binding)
  }

  /**
   * Binds a factory to the Token.
   *
   * @param factory Factory to be bound to the Token.
   */
  public toFactory<U>(factory: Factory<U>): LifecycleBinding<T> {
    this.binding.provider = { factory: factory as any }
    return new LifecycleBinding(this.binding)
  }

  /**
   * Defines an alias to the Token.
   *
   * @param token Token to be aliased.
   */
  public toToken<U>(token: InjectableToken<U>): LifecycleBinding<T> {
    this.binding.provider = { token: token as any }
    return new LifecycleBinding(this.binding)
  }

  /**
   * Binds a value to the Token.
   *
   * @param value Value to be bound to the Token.
   */
  public toValue<U>(value: U): LifecycleBinding<T> {
    this.binding.provider = { value: value as any }
    return new LifecycleBinding(this.binding)
  }

  /**
   * Binds a `Constructor` Injectable Token to itself.
   */
  public toSelf(): LifecycleBinding<T> {
    if (!isConstructorToken<T>(this.binding.token)) {
      throw new TypeError(
        `The token "${String(this.binding.token)}" is not a valid constructor.`
      )
    }

    return this.toClass(this.binding.token)
  }
}
