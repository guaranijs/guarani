import { User } from '../entities/user.entity';

/**
 * Interface of the User Service.
 *
 * The User Service contains the operations regarding the OAuth 2.0 End User.
 */
export interface UserServiceInterface {
  /**
   * Searches the application's storage for an End User containing the provided Identifier.
   *
   * @param id Identifier of the End User.
   * @returns End User based on the provided Identifier.
   */
  findOne(id: string): Promise<User | null>;

  /**
   * Searches the application's storage for a User containing the provided Username.
   *
   * *note: this method only needs implementation when using the **Resource Owner Password Credentials** Grant Type*.
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
  findByResourceOwnerCredentials?(username: string, password: string): Promise<User | null>;
}
