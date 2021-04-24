import {
  defineParamInjectableType,
  definePropertyInjectableType,
  getDesignPropType
} from '../metadata'
import { InjectableToken } from '../tokens'
import { Constructor } from '../types'

/**
 * Injects a token into the Injectable class' constructor or property.
 *
 * @param token - Token to be injected.
 */
export function Inject<T = any>(
  token?: InjectableToken<T>
): ParameterDecorator & PropertyDecorator {
  return (
    target: Constructor<T>,
    propertyKey: string | symbol,
    parameterIndex?: number
  ) => {
    // Injecting into the parameters of the constructor.
    if (propertyKey == null && typeof parameterIndex === 'number') {
      defineParamInjectableType(target, parameterIndex, token ?? target, false)
    }

    if (parameterIndex == null) {
      const type = getDesignPropType(target, propertyKey)

      definePropertyInjectableType(
        target.constructor,
        propertyKey,
        token ?? type,
        false
      )
    }
  }
}
