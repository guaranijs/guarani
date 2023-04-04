import { Constructor } from '@guarani/di';

import { S256Pkce } from './S256.pkce';
import { PkceInterface } from './pkce.interface';
import { Pkce } from './pkce.type';
import { PlainPkce } from './plain.pkce';

/**
 * PKCE Registry.
 */
export const pkceRegistry: Record<Pkce, Constructor<PkceInterface>> = {
  S256: S256Pkce,
  plain: PlainPkce,
};
