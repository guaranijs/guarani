import { Constructor } from '@guarani/types';

import { GrantType } from '../types/grant-type';
import { AuthorizationCodeGrantType } from './authorization-code.grant-type';
import { ClientCredentialsGrantType } from './client-credentials.grant-type';
import { IGrantType } from './grant-type.interface';
import { PasswordGrantType } from './password.grant-type';
import { RefreshTokenGrantType } from './refresh-token.grant-type';

export const GRANT_TYPE_REGISTRY: Record<GrantType, Constructor<IGrantType>> = {
  authorization_code: AuthorizationCodeGrantType,
  client_credentials: ClientCredentialsGrantType,
  password: PasswordGrantType,
  refresh_token: RefreshTokenGrantType,
};
