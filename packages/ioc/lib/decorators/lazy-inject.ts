import { Constructor, Factory } from '@guarani/utils'

import { defineParamInjectableType } from '../metadata'
import { InjectableToken, LazyToken } from '../tokens'

/**
 * Injects a LazyToken into the Injectable's class constructor.
 *
 * The **LazyToken** is a special **InjectableToken** used to
 * allow the injection of constructors that, otherwise, would cause
 * a **Circular Dependency** error.
 *
 * @param wrappedConstructor Constructor encapsulated into a Factory.
 */
export function LazyInject<T = any>(
  wrappedConstructor: Factory<InjectableToken<T>>
): PropertyDecorator & ParameterDecorator {
  return function (
    target: Constructor<T>,
    propertyKey: string | symbol,
    parameterIndex?: number
  ) {
    // Injecting into the parameters of the constructor.
    if (propertyKey == null && typeof parameterIndex === 'number') {
      const lazyToken = new LazyToken(wrappedConstructor)
      defineParamInjectableType(target, parameterIndex, lazyToken, false)
    }
  }
}
