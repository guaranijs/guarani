import { Constructor } from '@guarani/types';

import { AuthorizationCodeGrantType } from './authorization-code.grant-type';
import { ClientCredentialsGrantType } from './client-credentials.grant-type';
import { DeviceCodeGrantType } from './device-code.grant-type';
import { GrantTypeInterface } from './grant-type.interface';
import { GrantType } from './grant-type.type';
import { JwtBearerGrantType } from './jwt-bearer.grant-type';
import { RefreshTokenGrantType } from './refresh-token.grant-type';
import { ResourceOwnerPasswordCredentialsGrantType } from './resource-owner-password-credentials.grant-type';

/**
 * Grant Type Registry.
 */
export const grantTypeRegistry: Record<GrantType, Constructor<GrantTypeInterface>> = {
  authorization_code: AuthorizationCodeGrantType,
  client_credentials: ClientCredentialsGrantType,
  password: ResourceOwnerPasswordCredentialsGrantType,
  refresh_token: RefreshTokenGrantType,
  'urn:ietf:params:oauth:grant-type:device_code': DeviceCodeGrantType,
  'urn:ietf:params:oauth:grant-type:jwt-bearer': JwtBearerGrantType,
};
