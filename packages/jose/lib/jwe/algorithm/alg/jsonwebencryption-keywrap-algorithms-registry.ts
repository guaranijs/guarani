import { SupportedJsonWebEncryptionKeyWrapAlgorithm } from './supported-jsonwebencryption-keyencryption-algorithm';
import { A128KW, A192KW, A256KW } from './aes';
import { A128GCMKW, A192GCMKW, A256GCMKW } from './aes-gcm';
import { dir } from './dir';
import { JsonWebEncryptionKeyWrapAlgorithm } from './jsonwebencryption-keywrap.algorithm';
import { RSA1_5, RSA_OAEP, RSA_OAEP_256, RSA_OAEP_384, RSA_OAEP_512 } from './rsa';

/**
 * JSON Web Encryption Key Wrap Algorithms Registry.
 */
export const JSON_WEB_ENCRYPTION_KEY_WRAP_ALGORITHMS_REGISTRY: Record<
  SupportedJsonWebEncryptionKeyWrapAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm
> = {
  'RSA-OAEP': RSA_OAEP,
  'RSA-OAEP-256': RSA_OAEP_256,
  'RSA-OAEP-384': RSA_OAEP_384,
  'RSA-OAEP-512': RSA_OAEP_512,
  A128GCMKW: A128GCMKW,
  A128KW: A128KW,
  A192GCMKW: A192GCMKW,
  A192KW: A192KW,
  A256GCMKW: A256GCMKW,
  A256KW: A256KW,
  RSA1_5: RSA1_5,
  dir: dir,
};
