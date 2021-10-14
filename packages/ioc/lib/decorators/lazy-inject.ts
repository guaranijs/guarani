import { Constructor, Factory } from '@guarani/utils'

import {
  defineParamInjectableType,
  definePropertyInjectableType
} from '../metadata'
import { InjectableToken, LazyToken } from '../tokens'

/**
 * Injects a LazyToken into the Injectable's class constructor.
 *
 * The **LazyToken** is a special **InjectableToken** used to
 * allow the injection of Tokens that, otherwise, would cause
 * a **Circular Dependency** error.
 *
 * @param wrappedToken Token encapsulated into a Factory.
 */
export function LazyInject<T = any>(
  wrappedToken: Factory<InjectableToken<T>>
): PropertyDecorator & ParameterDecorator {
  return function (
    target: Constructor<T>,
    propertyKey: string | symbol,
    parameterIndex?: number
  ) {
    const lazyToken = new LazyToken(wrappedToken)

    // Injecting into the parameters of the constructor.
    if (propertyKey == null && typeof parameterIndex === 'number') {
      defineParamInjectableType(target, parameterIndex, lazyToken, false)
    }

    if (parameterIndex == null) {
      const isStatic = target.prototype != null

      definePropertyInjectableType(
        isStatic ? target : target.constructor,
        propertyKey,
        lazyToken,
        false,
        isStatic
      )
    }
  }
}
