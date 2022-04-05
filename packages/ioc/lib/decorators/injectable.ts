import { getDesignParamTypes, getParamTokens, InjectableType, setParamTypes } from '../metadata';

/**
 * Decorates a class enabling it to be resolved by the IoC Container,
 * should it be registered at said Container.
 */
export function Injectable(): ClassDecorator {
  return function (target: Function): void {
    const designParamTypes = getDesignParamTypes(target);
    const tokens = getParamTokens(target);

    const types = designParamTypes.map((paramType, index) => {
      const newInjectableType: InjectableType<any> = { isStatic: false, multiple: false, token: paramType };

      if (tokens === undefined) {
        return newInjectableType;
      }

      return tokens[index] ?? newInjectableType;
    });

    setParamTypes(target, types);
  };
}
