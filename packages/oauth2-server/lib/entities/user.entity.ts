import { Dict } from '@guarani/types';

/**
 * Representation of the OAuth 2.0 End User.
 */
export interface UserEntity extends Dict {
  /**
   * Identifier of the End User.
   */
  readonly id: string;

  /**
   * Checks if the provided Password matches the User's one.
   *
   * @param passowrd Password provided at the Request.
   */
  checkPassword?(passowrd: string): Promise<void>;
}
