import { PARAM_TOKENS, PROP_TOKENS } from '../metadata/metadata.keys';
import { setTokenDescriptor } from '../metadata/set-token-descriptor';
import { AbstractConstructor } from '../types/abstract-constructor.interface';
import { Constructor } from '../types/constructor.interface';
import { InjectableToken } from '../types/injectable-token.type';

/**
 * Marks the parameter or property for injection by the Container.
 *
 * @param token Token used to resolve the dependency.
 */
export function Inject(token?: InjectableToken<any>): ParameterDecorator & PropertyDecorator {
  return function (
    target: object | AbstractConstructor<any> | Constructor<any>,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ): void {
    // Injects into an argument of the constructor.
    if (propertyKey === undefined && parameterIndex !== undefined && typeof target !== 'object') {
      const paramType: InjectableToken<any> = Reflect.getMetadata('design:paramtypes', target)[parameterIndex];
      setTokenDescriptor<any>(PARAM_TOKENS, target, parameterIndex, { token: token ?? paramType, multiple: false });
    }

    // Injects into a property of the target.
    if (propertyKey !== undefined && parameterIndex === undefined) {
      const propType = Reflect.getMetadata('design:type', target, propertyKey);
      setTokenDescriptor<any>(PROP_TOKENS, target, propertyKey, { token: token ?? propType, multiple: false });
    }
  };
}
