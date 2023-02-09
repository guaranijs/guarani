import { PARAM_TOKENS, PROP_TOKENS } from '../metadata/metadata.keys';
import { setTokenDescriptor } from '../metadata/set-token-descriptor';
import { AbstractConstructor } from '../types/abstract-constructor.interface';
import { Constructor } from '../types/constructor.interface';
import { LazyToken } from '../types/lazy-token';

/**
 * The LazyToken is a special InjectableToken used to allow the injection of Tokens that,
 * otherwise, would cause a Circular Dependency error.
 *
 * @param wrappedToken Function that wraps the Constructor Injectable Token to be lazy injected.
 */
export function LazyInject(wrappedToken: () => Constructor<any>): PropertyDecorator & ParameterDecorator {
  return function (
    target: object | AbstractConstructor<any> | Constructor<any>,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ): void {
    const lazyToken = new LazyToken(wrappedToken);

    // Injects into an argument of the constructor.
    if (propertyKey === undefined && parameterIndex !== undefined && typeof target !== 'object') {
      setTokenDescriptor<any>(PARAM_TOKENS, target, parameterIndex, { token: lazyToken, multiple: false });
    }

    // Injects into a property of the target.
    if (propertyKey !== undefined && parameterIndex === undefined) {
      setTokenDescriptor<any>(PROP_TOKENS, target, propertyKey, { token: lazyToken, multiple: false });
    }
  };
}
