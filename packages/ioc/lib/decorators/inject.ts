import { Constructor } from '@guarani/utils'

import {
  defineParamInjectableType,
  definePropertyInjectableType,
  getDesignParamTypes,
  getDesignPropType
} from '../metadata'
import { InjectableToken } from '../tokens'

/**
 * Injects a token into the Injectable class' constructor or property.
 *
 * @param token Token to be injected.
 */
export function Inject<T = any>(
  token?: InjectableToken<T>
): ParameterDecorator & PropertyDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex?: number
  ) => {
    // Injecting into the parameters of the constructor.
    if (propertyKey == null && typeof parameterIndex === 'number') {
      const type = getDesignParamTypes(target)[parameterIndex]
      defineParamInjectableType(target, parameterIndex, token ?? type, false)
    }

    if (parameterIndex == null) {
      const type = getDesignPropType(target, propertyKey)
      const isStatic = (<Constructor<T>>target).prototype !== undefined

      definePropertyInjectableType(
        isStatic ? target : target.constructor,
        propertyKey,
        token ?? type,
        false,
        isStatic
      )
    }
  }
}
