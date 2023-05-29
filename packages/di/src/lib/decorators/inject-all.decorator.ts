import { AbstractConstructor, Constructor } from '@guarani/types';

import { PARAM_TOKENS, PROP_TOKENS } from '../metadata/metadata.keys';
import { setTokenDescriptor } from '../metadata/set-token-descriptor';
import { InjectableToken } from '../types/injectable-token.type';

/**
 * Injects all the resolved instances of the requested Token.
 *
 * @param token Token used to resolve the dependencies.
 */
export function InjectAll<T>(token: InjectableToken<T>): ParameterDecorator & PropertyDecorator {
  return function (
    target: object | AbstractConstructor<T> | Constructor<T>,
    propertyKey?: string | symbol,
    parameterIndex?: number
  ): void {
    // Injects into an argument of the constructor.
    if (typeof propertyKey === 'undefined' && typeof parameterIndex !== 'undefined' && typeof target !== 'object') {
      setTokenDescriptor<unknown>(PARAM_TOKENS, target, parameterIndex, { token, multiple: true });
    }

    // Injects into a property of the target.
    if (typeof propertyKey !== 'undefined' && typeof parameterIndex === 'undefined') {
      setTokenDescriptor<unknown>(PROP_TOKENS, target, propertyKey, { token, multiple: true });
    }
  };
}
