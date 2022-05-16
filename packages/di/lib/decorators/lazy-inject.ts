import { Constructor, Dict, Optional } from '@guarani/types';

import { LazyToken } from '../lazy-token';
import { TokenDescriptor } from '../types/token-descriptor';

/**
 * The LazyToken is a special InjectableToken used to allow the injection of Tokens that,
 * otherwise, would cause a Circular Dependency error.
 *
 * If the Token is not registered and its descriptor is marked as optional, then it will resolve to **undefined**,
 * otherwise, it will throw a {@link TokenNotRegisteredException}.
 *
 * @param wrappedToken Function that wraps the Constructor Injectable Token to be lazy injected.
 * @param optional Informs if the Container can inject **undefined** if the Token is not registered.
 */
export function LazyInject(
  wrappedToken: () => Constructor,
  optional: Optional<boolean> = false
): PropertyDecorator & ParameterDecorator {
  return function (
    target: Object | Function,
    propertyKey: Optional<string | symbol>,
    parameterIndex?: Optional<number>
  ) {
    const lazyToken = new LazyToken(wrappedToken);

    if (propertyKey === undefined && parameterIndex !== undefined && typeof target === 'function') {
      const paramTokens: Dict<TokenDescriptor<any>> = Reflect.getMetadata('guarani:paramtokens', target) ?? {};
      paramTokens[parameterIndex] = { token: lazyToken, multiple: false, optional };
      Reflect.defineMetadata('guarani:paramtokens', paramTokens, target);
    }

    if (propertyKey !== undefined && parameterIndex === undefined) {
      const propTokens: Map<string | symbol, TokenDescriptor<any>> = Reflect.getMetadata(
        'guarani:proptokens',
        target
      ) ?? new Map<string | symbol, TokenDescriptor<any>>();

      propTokens.set(propertyKey, { token: lazyToken, multiple: false, optional });

      Reflect.defineMetadata('guarani:proptokens', propTokens, target);
    }
  };
}
