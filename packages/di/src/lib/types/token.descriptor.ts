import { InjectableToken } from './injectable-token.type';

/**
 * Describes the metadata related to an injection in a resolution context.
 */
export interface TokenDescriptor<T> {
  /**
   * Token to be resolved.
   */
  token: InjectableToken<T>;

  /**
   * Informs whether or not the Container will return all instances of the Token.
   */
  multiple: boolean;

  /**
   * Informs if the resolution of the Token is optional.
   */
  optional: boolean;
}
