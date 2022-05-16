import { Dict, Optional } from '@guarani/types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { TokenNotRegisteredException } from '../exceptions/token-not-registered.exception';
import { InjectableToken } from '../injectable-token';
import { TokenDescriptor } from '../types/token-descriptor';

/**
 * Marks the property for injection by the Container.
 */
export function Inject(): PropertyDecorator;

/**
 * Injects the resolved instance of the requested Token.
 *
 * @param token Token used to resolve the dependency.
 */
export function Inject(token: InjectableToken<any>): ParameterDecorator & PropertyDecorator;

/**
 * Injects the infered Token.
 *
 * If the Token is not registered and its descriptor is marked as optional, then it will resolve to **undefined**,
 * otherwise, it will throw a {@link TokenNotRegisteredException}.
 *
 * @param optional Informs if the Container can inject **undefined** if the Token is not registered.
 */
export function Inject(optional: boolean): ParameterDecorator & PropertyDecorator;

/**
 * Injects the requested Token.
 *
 * If the Token is not registered and its descriptor is marked as optional, then it will resolve to **undefined**,
 * otherwise, it will throw a {@link TokenNotRegisteredException}.
 *
 * @param token Token used to resolve the dependency.
 * @param optional Informs if the Container can inject **undefined** if the Token is not registered.
 */
export function Inject(token: InjectableToken<any>, optional: boolean): ParameterDecorator & PropertyDecorator;

/**
 * Marks the parameter or property for injection by the Container.
 *
 * @param tokenOrOptional Requested Token or optional entry of the Token Descriptor.
 * @param optional Optional entry of the Token Descriptor
 */
export function Inject(
  tokenOrOptional?: Optional<InjectableToken<any> | boolean>,
  optional: Optional<boolean> = false
): ParameterDecorator & PropertyDecorator {
  const token: Optional<InjectableToken<any>> = typeof tokenOrOptional !== 'boolean' ? tokenOrOptional : undefined;
  optional = typeof tokenOrOptional === 'boolean' ? tokenOrOptional : optional;

  return function (
    target: Object | Function,
    propertyKey: Optional<string | symbol>,
    parameterIndex?: Optional<number>
  ): void {
    if (propertyKey === undefined && parameterIndex !== undefined && typeof target === 'function') {
      const designParamTypes: any[] = Reflect.getMetadata('design:paramtypes', target);
      const typeToken: InjectableToken<any> = designParamTypes[parameterIndex];

      const paramTokens: Dict<TokenDescriptor<any>> = Reflect.getMetadata('guarani:paramtokens', target) ?? {};
      paramTokens[parameterIndex] = { token: token ?? typeToken, multiple: false, optional: optional! };
      Reflect.defineMetadata('guarani:paramtokens', paramTokens, target);
    }

    if (propertyKey !== undefined && parameterIndex === undefined) {
      const propertyType = Reflect.getMetadata('design:type', target, propertyKey);

      const propTokens: Map<string | symbol, TokenDescriptor<any>> = Reflect.getMetadata(
        'guarani:proptokens',
        target
      ) ?? new Map<string | symbol, TokenDescriptor<any>>();

      propTokens.set(propertyKey, { token: token ?? propertyType, multiple: false, optional: optional! });

      Reflect.defineMetadata('guarani:proptokens', propTokens, target);
    }
  };
}
