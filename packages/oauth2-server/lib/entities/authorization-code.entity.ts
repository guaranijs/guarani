import { Nullable } from '@guarani/types';

import { SupportedPkceMethod } from '../pkce/types/supported-pkce-method';
import { AbstractToken } from './abstract-token';
import { UserEntity } from './user.entity';

/**
 * Representation of the OAuth 2.0 Authorization Code.
 */
export interface AuthorizationCodeEntity extends AbstractToken {
  /**
   * Redirect URI provided by the Client.
   */
  readonly redirectUri: string;

  /**
   * Code Challenge provided by the Client.
   */
  readonly codeChallenge: string;

  /**
   * Code Challenge Method used to verify the Code Challenge.
   */
  readonly codeChallengeMethod: Nullable<SupportedPkceMethod>;

  /**
   * User that granted access to the Client.
   */
  readonly user: UserEntity;
}
