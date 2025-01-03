import { Dictionary, Nullable } from '@guarani/types';

import { User } from '../entities/user.entity';
import { UserClaimsParameters } from '../tokens/user.claims.parameters';
import { AuthorizationRequestClaimsParameter } from '../types/authorization-request-claims-parameter.type';

/**
 * Interface of the User Service.
 *
 * The User Service contains the operations regarding the OAuth 2.0 End User.
 */
export interface UserServiceInterface {
  /**
   * Creates a Login representing the End User's Authentication.
   *
   * @param parameters Parameters of the User Registration.
   * @returns Generated User.
   */
  create(parameters: Dictionary<any>): Promise<User>;

  /**
   * Searches the application's storage for an End User containing the provided Identifier.
   *
   * @param id Identifier of the End User.
   * @returns End User based on the provided Identifier.
   */
  findOne(id: string): Promise<Nullable<User>>;

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
  findByResourceOwnerCredentials?(username: string, password: string): Promise<Nullable<User>>;

  /**
   * Retrieves the claims of the provided User based on the requested scopes and claims.
   *
   * @param user End User to have its information gathered.
   * @param scopes Scopes requested by the Client.
   * @param claims Claims requested by the Client.
   * @returns Claims about the provided User.
   */
  getUserClaims?(
    user: User,
    scopes: string[],
    claims: AuthorizationRequestClaimsParameter,
  ): Promise<UserClaimsParameters>;
}
