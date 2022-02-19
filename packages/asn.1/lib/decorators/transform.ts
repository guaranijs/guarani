import { OneOrMany, Optional } from '@guarani/types';

import { setTransformer } from '../metadata/helpers';
import { Transformer } from '../transformer';

export interface TransformersOptions {
  readonly afterDecode?: Optional<OneOrMany<(value: any) => any>>;
  readonly afterEncode?: Optional<OneOrMany<(value: any) => any>>;
  readonly beforeDecode?: Optional<OneOrMany<(value: any) => any>>;
  readonly beforeEncode?: Optional<OneOrMany<(value: any) => any>>;
}

export function Transform(options: Optional<TransformersOptions> = {}): PropertyDecorator {
  return function (target: Function | object, propertyKey: string | symbol): void {
    const { afterDecode, afterEncode, beforeDecode, beforeEncode } = options;

    const transformers = <Transformer>{
      afterDecode: afterDecode !== undefined ? (Array.isArray(afterDecode) ? afterDecode : [afterDecode]) : [],
      afterEncode: afterEncode !== undefined ? (Array.isArray(afterEncode) ? afterEncode : [afterEncode]) : [],
      beforeDecode: beforeDecode !== undefined ? (Array.isArray(beforeDecode) ? beforeDecode : [beforeDecode]) : [],
      beforeEncode: beforeEncode !== undefined ? (Array.isArray(beforeEncode) ? beforeEncode : [beforeEncode]) : [],
    };

    setTransformer(target, propertyKey, transformers);
  };
}
