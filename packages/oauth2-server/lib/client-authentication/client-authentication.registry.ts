import { Constructor } from '@guarani/types';

import { ClientAuthentication } from '../types/client-authentication';
import { IClientAuthentication } from './client-authentication.interface';
import { ClientSecretBasicClientAuthentication } from './client-secret-basic.client-authentication';
import { ClientSecretPostClientAuthentication } from './client-secret-post.client-authentication';
import { NoneClientAuthentication } from './none.client-authentication';

export const CLIENT_AUTHENTICATION_REGISTRY: Record<ClientAuthentication, Constructor<IClientAuthentication>> = {
  client_secret_basic: ClientSecretBasicClientAuthentication,
  client_secret_post: ClientSecretPostClientAuthentication,
  none: NoneClientAuthentication,
};
