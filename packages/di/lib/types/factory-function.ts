import { DIContainer } from '../container/container';

/**
 * Defines the format of a factory function.
 */
export type FactoryFunction<T> = (container: DIContainer) => T;
