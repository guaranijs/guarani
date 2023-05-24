import { AbstractConstructor } from './abstract-constructor.interface';
import { Constructor } from './constructor.interface';

/**
 * Describes a Constructor or its instance.
 */
export type ConstructorOrInstance<T> = T | AbstractConstructor<T> | Constructor<T>;
