import { defineParamInjectableType } from '../metadata'
import { InjectableToken } from '../tokens'
import { Constructor } from '../types'

/**
 * Injects a token into the Injectable class' constructor or property.
 *
 * @param token - Token to be injected.
 */
export function Inject<T = any>(
  token?: InjectableToken<T>
): ParameterDecorator {
  return (
    target: Constructor<T>,
    propertyKey: string | symbol,
    parameterIndex: number
  ) => {
    // Injecting into the parameters of the constructor.
    if (propertyKey == null) {
      defineParamInjectableType(target, parameterIndex, token ?? target, false)
    }
  }
}
