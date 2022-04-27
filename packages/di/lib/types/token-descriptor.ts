import { InjectableToken } from '../injectable-token';

/**
 * Describes the metadata related to an injection in a resolution context.
 */
export interface TokenDescriptor<T> {
  /**
   * Token to be resolved.
   */
  readonly token: InjectableToken<T>;

  /**
   * Informs whether or not the Container will return all instances of the Token.
   */
  readonly multiple: boolean;

  /**
   * Informs if the resolution of the Token is optional.
   */
  readonly optional: boolean;
}
