import { DEF } from './def';
import { JWECompression } from './jwe-compression';

/**
 * Supported JSON Web Encryption Plaintext Compression Algorithms.
 */
export type SupportedJWECompression = 'DEF';

/**
 * Store of the supported JWE Plaintext Compression Algorithms.
 */
export const JWE_COMPRESSIONS: Record<SupportedJWECompression, JWECompression> = {
  DEF: DEF,
};
