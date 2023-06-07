import { Constructor } from '@guarani/types';

import { ClientAuthenticationInterface } from './client-authentication.interface';
import { ClientAuthentication } from './client-authentication.type';
import { ClientSecretBasicClientAuthentication } from './client-secret-basic.client-authentication';
import { ClientSecretJwtClientAuthentication } from './client-secret-jwt.client-authentication';
import { ClientSecretPostClientAuthentication } from './client-secret-post.client-authentication';
import { NoneClientAuthentication } from './none.client-authentication';
import { PrivateKeyJwtClientAuthentication } from './private-key-jwt.client-authentication';

/**
 * Client Authentication Methods Registry.
 */
export const clientAuthenticationRegistry: Record<ClientAuthentication, Constructor<ClientAuthenticationInterface>> = {
  client_secret_basic: ClientSecretBasicClientAuthentication,
  client_secret_jwt: ClientSecretJwtClientAuthentication,
  client_secret_post: ClientSecretPostClientAuthentication,
  none: NoneClientAuthentication,
  private_key_jwt: PrivateKeyJwtClientAuthentication,
};
