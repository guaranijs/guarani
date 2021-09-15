import {
  getDesignParamTypes,
  getParamTokens,
  InjectableType,
  setParamTypes
} from '../metadata'

/**
 * Decorates a class enabling it to be resolved by the IoC Container,
 * should it be registered at said Container.
 *
 * @returns Decorated class as an Injectable.
 */
export function Injectable(): ClassDecorator {
  return function (target) {
    const paramTypes = getDesignParamTypes(target)
    const tokens = getParamTokens(target)

    const types = paramTypes.map<InjectableType<any>>((paramType, index) => {
      if (!tokens) {
        return { multiple: false, token: paramType, isStatic: false }
      }

      return tokens[index]
        ? tokens[index]
        : { multiple: false, token: paramType, isStatic: false }
    })

    setParamTypes(target, types)
  }
}
