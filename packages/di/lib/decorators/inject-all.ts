import { Dict, Optional } from '@guarani/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { TokenNotRegisteredException } from '../exceptions/token-not-registered.exception';
import { InjectableToken } from '../injectable-token';
import { TokenDescriptor } from '../types/token-descriptor';

/**
 * Injects all the resolved instances of the requested Token.
 *
 * If the Token is not registered and its descriptor is marked as optional, then it will resolve to **undefined**,
 * otherwise, it will throw a {@link TokenNotRegisteredException}.
 *
 * @param token Token used to resolve the dependencies.
 * @param optional Informs if the Container can inject **undefined** if the Token is not registered.
 */
export function InjectAll(
  token: InjectableToken<any>,
  optional: Optional<boolean> = false
): ParameterDecorator & PropertyDecorator {
  return function (
    target: Object | Function,
    propertyKey: Optional<string | symbol>,
    parameterIndex?: Optional<number>
  ): void {
    if (propertyKey === undefined && parameterIndex !== undefined && typeof target === 'function') {
      const paramTokens: Dict<TokenDescriptor<any>> = Reflect.getMetadata('guarani:paramtokens', target) ?? {};
      paramTokens[parameterIndex] = { token, multiple: true, optional };
      Reflect.defineMetadata('guarani:paramtokens', paramTokens, target);
    }

    if (propertyKey !== undefined && parameterIndex === undefined) {
      const propTokens: Map<string | symbol, TokenDescriptor<any>> = Reflect.getMetadata(
        'guarani:proptokens',
        target
      ) ?? new Map<string | symbol, TokenDescriptor<any>>();

      propTokens.set(propertyKey, { token, multiple: true, optional });

      Reflect.defineMetadata('guarani:proptokens', propTokens, target);
    }
  };
}
