import { Optional } from '@guarani/types';

import { UserEntity } from '../entities/user.entity';

/**
 * Representation of the User Service.
 *
 * The User Service contains the operations performed by Guarani that are concerned with the OAuth 2.0 End User.
 */
export interface UserService {
  /**
   * Searches the application's storage for a User containing the provided Identifier.
   *
   * @param userId Identifier of the User.
   * @returns User based on the provided Identifier.
   */
  findUser(userId: string): Promise<Optional<UserEntity>>;

  /**
   * Searches the application's storage for a User containing the provided Username.
   *
   * @param username Username of the User to be fetched.
   *
   * *notice: the **username** does not necessarily mean that a username field has to be defined at the User Entity.
   * It can mean anything from a username to an email, custom Identifier, personal documentation, phone number
   * or anything that the application uses to identify a single User.*
   *
   * @param password Password of the User to be fetched.
   * @returns User based on the provided Username.
   */
  authenticate(username: string, password: string): Promise<Optional<UserEntity>>;
}
