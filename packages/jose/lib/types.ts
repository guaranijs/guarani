import { JoseHeader } from './jose.header';
import { JsonWebKey } from './jwk/jsonwebkey';

/**
 * Supported Hash functions.
 */
export type SupportedHash = 'SHA1' | 'SHA256' | 'SHA384' | 'SHA512';

/**
 * Function type used to load a JSON Web Key based on a JOSE Header.
 */
export type KeyLoader = (header: JoseHeader) => JsonWebKey;
