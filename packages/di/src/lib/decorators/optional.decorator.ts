import { PARAM_TOKENS, PROP_TOKENS } from '../metadata/metadata.keys';
import { setTokenDescriptor } from '../metadata/set-token-descriptor';
import { AbstractConstructor } from '../types/abstract-constructor.interface';
import { Constructor } from '../types/constructor.interface';

/**
 * Marks the dependency as **optional**.
 *
 * This informs the Dependency Injection Container to inject **undefined** when the Injectable Token
 * of the dependency is not registered.
 */
export function Optional(): ParameterDecorator & PropertyDecorator {
  return function (
    target: object | AbstractConstructor<any> | Constructor<any>,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number
  ): void {
    // Constructor parameters
    if (propertyKey === undefined && parameterIndex !== undefined && typeof target !== 'object') {
      setTokenDescriptor<any>(PARAM_TOKENS, target, parameterIndex, { optional: true });
    }

    // Target's property
    if (propertyKey !== undefined && parameterIndex === undefined) {
      setTokenDescriptor<any>(PROP_TOKENS, target, propertyKey, { optional: true });
    }
  };
}
