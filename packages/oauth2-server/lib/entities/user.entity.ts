import { Dict } from '@guarani/types';

/**
 * Representation of the OAuth 2.0 End User.
 */
export interface UserEntity extends Dict {
  /**
   * Identifier of the End User.
   */
  readonly id: string;
}
