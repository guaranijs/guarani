import { DependencyInjectionContainer } from '../container/dependency-injection.container';

/**
 * Denotes a factory function.
 */
export type Factory<T> = (container: DependencyInjectionContainer) => T;
