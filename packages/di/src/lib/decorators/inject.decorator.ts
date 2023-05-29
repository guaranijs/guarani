import { AbstractConstructor, Constructor } from '@guarani/types';

import { PARAM_TOKENS, PROP_TOKENS } from '../metadata/metadata.keys';
import { setTokenDescriptor } from '../metadata/set-token-descriptor';
import { InjectableToken } from '../types/injectable-token.type';

/**
 * Marks the parameter or property for injection by the Container.
 *
 * @param token Token used to resolve the dependency.
 */
export function Inject<T>(token?: InjectableToken<T>): ParameterDecorator & PropertyDecorator {
  return function (
    target: object | AbstractConstructor<T> | Constructor<T>,
    propertyKey?: string | symbol,
    parameterIndex?: number
  ): void {
    // Injects into an argument of the constructor.
    if (typeof propertyKey === 'undefined' && typeof parameterIndex !== 'undefined' && typeof target !== 'object') {
      const paramType: InjectableToken<unknown> = Reflect.getMetadata('design:paramtypes', target)[parameterIndex];
      setTokenDescriptor<unknown>(PARAM_TOKENS, target, parameterIndex, { token: token ?? paramType, multiple: false });
    }

    // Injects into a property of the target.
    if (typeof propertyKey !== 'undefined' && typeof parameterIndex === 'undefined') {
      const propType = Reflect.getMetadata('design:type', target, propertyKey);
      setTokenDescriptor<unknown>(PROP_TOKENS, target, propertyKey, { token: token ?? propType, multiple: false });
    }
  };
}
