import { Constructor } from '@guarani/utils'

import {
  defineParamInjectableType,
  definePropertyInjectableType,
  getDesignPropType
} from '../metadata'
import { InjectableToken } from '../tokens'

/**
 * Injects all registered instances of a token into the Injectable class'
 * constructor or property.
 *
 * @param token Token to be injected.
 */
export function InjectAll<T = any>(
  token: InjectableToken<T>
): ParameterDecorator & PropertyDecorator {
  return function (
    target: Constructor<T>,
    propertyKey: string | symbol,
    parameterIndex?: number
  ): void {
    // Injecting into the parameters of the constructor.
    if (propertyKey == null) {
      defineParamInjectableType(target, parameterIndex, token, true)
    }

    if (parameterIndex == null) {
      const type = getDesignPropType(target, propertyKey)
      const isStatic = target.prototype !== undefined

      definePropertyInjectableType(
        isStatic ? target : target.constructor,
        propertyKey,
        token ?? type,
        true,
        isStatic
      )
    }
  }
}
