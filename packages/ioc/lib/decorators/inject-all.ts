import { Constructor, Optional } from '@guarani/types';

import { defineParamInjectableType, definePropertyInjectableType, getDesignPropType } from '../metadata';
import { InjectableToken } from '../tokens';

/**
 * Injects all registered instances of a token into the Injectable class'
 * constructor or property.
 *
 * @param token Token to be injected.
 */
export function InjectAll<T = any>(token: InjectableToken<T>): ParameterDecorator & PropertyDecorator {
  return function (target: Object, propertyKey: string | symbol, parameterIndex?: Optional<number>): void {
    // Injecting into the parameters of the constructor.
    if (propertyKey === undefined) {
      defineParamInjectableType(target, parameterIndex!, token, true);
    }

    if (parameterIndex === undefined) {
      const type = getDesignPropType(target, propertyKey);
      const isStatic = (<Constructor<T>>target).prototype !== undefined;

      definePropertyInjectableType(isStatic ? target : target.constructor, propertyKey, token ?? type, true, isStatic);
    }
  };
}
