import { AbstractConstructor, Constructor } from '@guarani/types';

import { PARAM_TOKENS, PROP_TOKENS } from '../metadata/metadata.keys';
import { setTokenDescriptor } from '../metadata/set-token-descriptor';
import { LazyToken } from '../types/lazy-token';

/**
 * The LazyToken is a special InjectableToken used to allow the injection of Tokens that,
 * otherwise, would cause a Circular Dependency error.
 *
 * @param wrappedToken Function that wraps the Constructor Injectable Token to be lazy injected.
 */
export function LazyInject<T>(
  wrappedToken: () => AbstractConstructor<T> | Constructor<T>,
): PropertyDecorator & ParameterDecorator {
  return function (
    target: object | AbstractConstructor<T> | Constructor<T>,
    propertyKey?: string | symbol,
    parameterIndex?: number,
  ): void {
    const lazyToken = new LazyToken<T>(wrappedToken);

    // Injects into an argument of the constructor.
    if (typeof propertyKey === 'undefined' && typeof parameterIndex !== 'undefined' && typeof target !== 'object') {
      setTokenDescriptor<T>(PARAM_TOKENS, target, parameterIndex, { token: lazyToken, multiple: false });
    }

    // Injects into a property of the target.
    if (typeof propertyKey !== 'undefined' && typeof parameterIndex === 'undefined') {
      setTokenDescriptor<T>(PROP_TOKENS, target, propertyKey, { token: lazyToken, multiple: false });
    }
  };
}
