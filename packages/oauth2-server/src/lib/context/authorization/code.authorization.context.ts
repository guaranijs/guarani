import { PkceInterface } from '../../pkces/pkce.interface';
import { CodeAuthorizationRequest } from '../../requests/authorization/code.authorization-request';
import { AuthorizationContext } from './authorization.context';

/**
 * Parameters of the Code Authorization Context.
 */
export interface CodeAuthorizationContext extends AuthorizationContext<CodeAuthorizationRequest> {
  /**
   * Code Challenge provided by the Client.
   */
  readonly codeChallenge: string;

  /**
   * PKCE Code Challenge Method used to verify the Code Challenge.
   */
  readonly codeChallengeMethod: PkceInterface;
}
