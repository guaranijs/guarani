import { Dict } from '@guarani/types';

import { TokenDescriptor } from '../types/token-descriptor';

/**
 * Marks the decorated class as an Injectable Token to be resolved by the Container once properly registered.
 */
export function Injectable(): ClassDecorator {
  return function (target: Function): void {
    const designParamTypes: any[] = Reflect.getMetadata('design:paramtypes', target) ?? [];
    const paramTokenDescriptors: Dict<TokenDescriptor<any>> = Reflect.getMetadata('guarani:paramtokens', target);

    const types: TokenDescriptor<any>[] = designParamTypes.map((designParamType, index) => {
      return paramTokenDescriptors?.[index] ?? { token: designParamType, multiple: false, optional: false };
    });

    Reflect.defineMetadata('guarani:paramtypes', types, target);
  };
}
