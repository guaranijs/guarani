import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { A128KW, A192KW, A256KW } from './aes.backend';
import { dir } from './dir.backend';
import { A128GCMKW, A192GCMKW, A256GCMKW } from './gcm.backend';
import { JsonWebEncryptionKeyWrapBackend } from './jsonwebencryption-keywrap.backend';
import { RSA1_5, RSA_OAEP, RSA_OAEP_256, RSA_OAEP_384, RSA_OAEP_512 } from './rsa.backend';

/**
 * JSON Web Encryption Key Wrap Backend Registry.
 */
export const JSONWEBENCRYPTION_KEYWRAP_REGISTRY: Record<
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebEncryptionKeyWrapBackend
> = {
  A128GCMKW,
  A128KW,
  A192GCMKW,
  A192KW,
  A256GCMKW,
  A256KW,
  dir,
  RSA1_5,
  'RSA-OAEP': RSA_OAEP,
  'RSA-OAEP-256': RSA_OAEP_256,
  'RSA-OAEP-384': RSA_OAEP_384,
  'RSA-OAEP-512': RSA_OAEP_512,
};
