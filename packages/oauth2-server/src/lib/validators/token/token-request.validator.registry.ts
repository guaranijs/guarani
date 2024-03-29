import { Constructor } from '@guarani/types';

import { GrantType } from '../../grant-types/grant-type.type';
import { AuthorizationCodeTokenRequestValidator } from './authorization-code.token-request.validator';
import { ClientCredentialsTokenRequestValidator } from './client-credentials.token-request.validator';
import { DeviceCodeTokenRequestValidator } from './device-code.token-request.validator';
import { JwtBearerTokenRequestValidator } from './jwt-bearer.token-request.validator';
import { RefreshTokenTokenRequestValidator } from './refresh-token.token-request.validator';
import { ResourceOwnerPasswordCredentialsTokenRequestValidator } from './resource-owner-password-credentials.token-request.validator';
import { TokenRequestValidator } from './token-request.validator';

/**
 * Token Request Validators Registry.
 */
export const tokenRequestValidatorsRegistry: Record<GrantType, Constructor<TokenRequestValidator>> = {
  authorization_code: AuthorizationCodeTokenRequestValidator,
  client_credentials: ClientCredentialsTokenRequestValidator,
  password: ResourceOwnerPasswordCredentialsTokenRequestValidator,
  refresh_token: RefreshTokenTokenRequestValidator,
  'urn:ietf:params:oauth:grant-type:device_code': DeviceCodeTokenRequestValidator,
  'urn:ietf:params:oauth:grant-type:jwt-bearer': JwtBearerTokenRequestValidator,
};
