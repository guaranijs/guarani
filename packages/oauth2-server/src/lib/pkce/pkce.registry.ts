import { Constructor } from '@guarani/di';

import { PkceMethod } from './pkce-method.type';
import { PkceInterface } from './pkce.interface';
import { PlainPkce } from './plain.pkce';
import { S256Pkce } from './S256.pkce';

/**
 * PKCE Registry.
 */
export const pkceRegistry: Record<PkceMethod, Constructor<PkceInterface>> = {
  S256: S256Pkce,
  plain: PlainPkce,
};
