import { Constructor } from '@guarani/types';

/**
 * Merges the provided mixin classes into a single one and returns it.
 *
 * @param mixins List of mixins to be merged into a single class.
 * @returns Constructor of the resulting class.
 */
export function applyMixins(mixins: Constructor[]): any {
  if (!Array.isArray(mixins) || mixins.length === 0) {
    throw new Error('Invalid parameter "mixins".');
  }

  if (mixins.length === 1) {
    return mixins[0];
  }

  const BaseMixin = mixins.shift()!;

  mixins.forEach((Mixin) => {
    Object.getOwnPropertyNames(Mixin.prototype).forEach((name) => {
      Object.defineProperty(
        BaseMixin.prototype,
        name,
        Object.getOwnPropertyDescriptor(Mixin.prototype, name) || Object.create(null)
      );
    });
  });

  return BaseMixin;
}
