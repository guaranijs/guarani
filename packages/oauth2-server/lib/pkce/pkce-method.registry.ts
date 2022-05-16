import { Constructor } from '@guarani/types';

import { PkceMethod } from '../types/pkce-method';
import { IPkceMethod } from './pkce-method.interface';
import { PlainPkceMethod } from './plain.pkce-method';
import { S256PkceMethod } from './s256.pkce-method';

export const PKCE_METHOD_REGISTRY: Record<PkceMethod, Constructor<IPkceMethod>> = {
  S256: S256PkceMethod,
  plain: PlainPkceMethod,
};
