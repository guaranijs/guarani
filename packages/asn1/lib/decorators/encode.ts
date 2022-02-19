import { setTransformer } from '../metadata/helpers';

/**
 * Defines a function that will transform the value of the property
 * before being encoded.
 *
 * @param transformer Function used to transform the value of the property.
 */
export function Encode<TArg = any, TRet = any>(transformer: (value: TArg) => TRet): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    setTransformer(target, propertyKey, transformer, 'encode');
  };
}
