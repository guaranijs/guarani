import { A128KW, A192KW, A256KW } from './aes';
import { A128GCMKW, A192GCMKW, A256GCMKW } from './aes-gcm';
import { dir } from './dir';
import { JWEAlgorithm } from './jwe-algorithm';
import { RSA1_5, RSA_OAEP, RSA_OAEP_256, RSA_OAEP_384, RSA_OAEP_512 } from './rsa';

/**
 * Supported JSON Web Encryption Key Wrapping Algorithms.
 */
export type SupportedJWEAlgorithm =
  | 'RSA1_5'
  | 'RSA-OAEP'
  | 'RSA-OAEP-256'
  | 'RSA-OAEP-384'
  | 'RSA-OAEP-512'
  | 'A128KW'
  | 'A192KW'
  | 'A256KW'
  | 'dir'
  // | 'ECDH-ES'
  // | 'ECDH-ES+A128KW'
  // | 'ECDH-ES+A192KW'
  // | 'ECDH-ES+A256KW'
  | 'A128GCMKW'
  | 'A192GCMKW'
  | 'A256GCMKW';
// | 'PBES2-HS256+A128KW'
// | 'PBES2-HS384+A192KW'
// | 'PBES2-HS512+A256KW'

/**
 * Store of the supported JWE Key Wrap Algorithms.
 */
export const JWE_ALGORITHMS: Record<SupportedJWEAlgorithm, JWEAlgorithm> = {
  RSA1_5: RSA1_5,
  'RSA-OAEP': RSA_OAEP,
  'RSA-OAEP-256': RSA_OAEP_256,
  'RSA-OAEP-384': RSA_OAEP_384,
  'RSA-OAEP-512': RSA_OAEP_512,
  A128KW: A128KW,
  A192KW: A192KW,
  A256KW: A256KW,
  dir: dir,
  A128GCMKW: A128GCMKW,
  A192GCMKW: A192GCMKW,
  A256GCMKW: A256GCMKW,
};
