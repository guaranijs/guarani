import { AbstractConstructor, Constructor } from '@guarani/types';

import { PARAM_TOKENS, PROP_TOKENS } from '../metadata/metadata.keys';
import { setTokenDescriptor } from '../metadata/set-token-descriptor';

/**
 * Marks the dependency as **optional**.
 *
 * This informs the Dependency Injection Container to inject **undefined** when the Injectable Token
 * of the dependency is not registered.
 */
export function Optional(): ParameterDecorator & PropertyDecorator {
  return function (
    target: object | AbstractConstructor<object> | Constructor<object>,
    propertyKey?: string | symbol,
    parameterIndex?: number
  ): void {
    // Constructor parameters
    if (typeof propertyKey === 'undefined' && typeof parameterIndex !== 'undefined' && typeof target !== 'object') {
      setTokenDescriptor<object>(PARAM_TOKENS, target, parameterIndex, { optional: true });
    }

    // Target's property
    if (typeof propertyKey !== 'undefined' && typeof parameterIndex === 'undefined') {
      setTokenDescriptor<object>(PROP_TOKENS, target, propertyKey, { optional: true });
    }
  };
}
