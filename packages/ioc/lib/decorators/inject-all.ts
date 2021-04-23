import { defineParamInjectableType } from '../metadata'
import { InjectableToken } from '../tokens'
import { Constructor } from '../types'

/**
 * Injects all registered instances of a token into the Injectable class'
 * constructor or property.
 *
 * @param token - Token to be injected.
 */
export function InjectAll<T = any>(
  token: InjectableToken<T>
): ParameterDecorator {
  return function (
    target: Constructor<T>,
    propertyKey: string | symbol,
    parameterIndex: number
  ): void {
    // Injecting into the parameters of the constructor.
    if (propertyKey == null) {
      defineParamInjectableType(target, parameterIndex, token, true)
    }
  }
}
