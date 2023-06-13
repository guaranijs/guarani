import { PkceInterface } from '../../pkces/pkce.interface';
import { AuthorizationContext } from './authorization-context';

/**
 * Parameters of the Code Authorization Context.
 */
export interface CodeAuthorizationContext extends AuthorizationContext {
  /**
   * Code Challenge provided by the Client.
   */
  readonly codeChallenge: string;

  /**
   * PKCE Code Challenge Method used to verify the Code Challenge.
   */
  readonly codeChallengeMethod: PkceInterface;
}
