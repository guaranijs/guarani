import { DependencyInjectionException } from './dependency-injection.exception';

/**
 * Thrown when the Container is not able to resolve the requested Token.
 */
export class ResolutionException extends DependencyInjectionException {}
