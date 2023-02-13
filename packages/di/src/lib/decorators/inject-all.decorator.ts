import { PARAM_TOKENS, PROP_TOKENS } from '../metadata/metadata.keys';
import { setTokenDescriptor } from '../metadata/set-token-descriptor';
import { AbstractConstructor } from '../types/abstract-constructor.interface';
import { Constructor } from '../types/constructor.interface';
import { InjectableToken } from '../types/injectable-token.type';

/**
 * Injects all the resolved instances of the requested Token.
 *
 * @param token Token used to resolve the dependencies.
 */
export function InjectAll(token: InjectableToken<any>): ParameterDecorator & PropertyDecorator {
  return function (
    target: object | AbstractConstructor<any> | Constructor<any>,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ): void {
    // Injects into an argument of the constructor.
    if (propertyKey === undefined && parameterIndex !== undefined && typeof target !== 'object') {
      setTokenDescriptor<any>(PARAM_TOKENS, target, parameterIndex, { token, multiple: true });
    }

    // Injects into a property of the target.
    if (propertyKey !== undefined && parameterIndex === undefined) {
      setTokenDescriptor<any>(PROP_TOKENS, target, propertyKey, { token, multiple: true });
    }
  };
}
