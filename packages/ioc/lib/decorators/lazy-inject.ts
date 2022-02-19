import { Constructor, Optional } from '@guarani/types';

import { defineParamInjectableType, definePropertyInjectableType } from '../metadata';
import { InjectableToken, LazyToken } from '../tokens';

/**
 * Injects a LazyToken into the Injectable's class constructor.
 *
 * The **LazyToken** is a special **InjectableToken** used to
 * allow the injection of Tokens that, otherwise, would cause
 * a **Circular Dependency** error.
 *
 * @param wrappedToken Token encapsulated into a Factory.
 */
export function LazyInject<T = any>(wrappedToken: () => InjectableToken<T>): PropertyDecorator & ParameterDecorator {
  return function (target: object, propertyKey: string | symbol, parameterIndex?: Optional<number>) {
    const lazyToken = new LazyToken(wrappedToken);

    // Injecting into the parameters of the constructor.
    if (propertyKey === undefined && typeof parameterIndex === 'number') {
      defineParamInjectableType(target, parameterIndex, lazyToken, false);
    }

    if (parameterIndex === undefined) {
      const isStatic = (<Constructor<T>>target).prototype !== undefined;

      definePropertyInjectableType(isStatic ? target : target.constructor, propertyKey, lazyToken, false, isStatic);
    }
  };
}
