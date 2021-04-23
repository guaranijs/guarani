import { Container } from '../container'
import {
  getDesignParamTypes,
  getParamTokens,
  InjectableType,
  setParamTypes
} from '../metadata'
import { isProvider, Provider } from '../providers'
import { InjectableToken } from '../tokens'

/**
 * Optional arguments to customize the injectable class.
 */
interface Options<T> extends Provider<T> {
  /**
   * Defines a custom name to the token that will represent the class.
   */
  token?: InjectableToken<T>

  /**
   * Defines whether or not the class will be automatically registered
   * at the Container.
   *
   * If this options is set to `false`, the class will have to be manually
   * registered at the Container using the `bindToken()` method, otherwise,
   * it will not be resolved when calling the Container's `resolve()` method.
   */
  autoInject?: boolean
}

/**
 * Decorates a class enabling it to be resolved by the IoC Container,
 * should it be registered at said Container.
 *
 * @param options - Optional arguments to customize the injectable class.
 * @returns Decorated class as an Injectable.
 */
export function Injectable<T = any>(options: Options<T> = {}): ClassDecorator {
  return function (target) {
    const paramTypes = getDesignParamTypes(target)
    const tokens = getParamTokens(target)

    const types = paramTypes.map<InjectableType<any>>((paramType, index) => {
      if (!tokens) return { multiple: false, token: paramType }

      return tokens[index]
        ? tokens[index]
        : { multiple: false, token: paramType }
    })

    setParamTypes(target, types)

    const autoInject = options.autoInject ?? true
    if (!autoInject) return

    setAutoInjection(target, options)
  }
}

/**
 * Handles the automatic registration of the class at the Container.
 *
 * @param target - Class to be registered at the Container.
 * @param options - Optional arguments to customize the injectable class.
 */
function setAutoInjection<T>(target: Function, options: Options<T>): void {
  const token = options.token ?? target
  const provider = isProvider<T>(options) ? options : { useClass: target }

  Container.bindToken<T>(token).to(provider)
}
