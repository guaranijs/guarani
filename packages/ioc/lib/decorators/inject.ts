import { Constructor, Optional } from '@guarani/types';

import {
  defineParamInjectableType,
  definePropertyInjectableType,
  getDesignParamTypes,
  getDesignPropType,
} from '../metadata';
import { InjectableToken } from '../tokens';

/**
 * Injects a token into the Injectable class' constructor or property.
 *
 * @param token Token to be injected.
 */
export function Inject<T = any>(token?: Optional<InjectableToken<T>>): ParameterDecorator & PropertyDecorator {
  return (target: object, propertyKey: string | symbol, parameterIndex?: Optional<number>) => {
    // Injecting into the parameters of the constructor.
    if (propertyKey === undefined && typeof parameterIndex === 'number') {
      const designParamTypes = getDesignParamTypes(target);
      const type = designParamTypes[parameterIndex];

      defineParamInjectableType(target, parameterIndex, token ?? type, false);
    }

    if (parameterIndex === undefined) {
      const type = getDesignPropType(target, propertyKey);
      const isStatic = (<Constructor<T>>target).prototype !== undefined;

      definePropertyInjectableType(isStatic ? target : target.constructor, propertyKey, token ?? type, false, isStatic);
    }
  };
}
