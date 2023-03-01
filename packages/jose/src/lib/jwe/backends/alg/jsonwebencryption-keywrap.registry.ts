import { JsonWebEncryptionKeyWrapAlgorithm } from '../../jsonwebencryption-keywrap-algorithm.type';
import { A128KW, A192KW, A256KW } from './aes.backend';
import { dir } from './dir.backend';
import { ECDH_ES, ECDH_ES_A128KW, ECDH_ES_A192KW, ECDH_ES_A256KW } from './ecdh.backend';
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
  'ECDH-ES': ECDH_ES,
  'ECDH-ES+A128KW': ECDH_ES_A128KW,
  'ECDH-ES+A192KW': ECDH_ES_A192KW,
  'ECDH-ES+A256KW': ECDH_ES_A256KW,
  RSA1_5,
  'RSA-OAEP': RSA_OAEP,
  'RSA-OAEP-256': RSA_OAEP_256,
  'RSA-OAEP-384': RSA_OAEP_384,
  'RSA-OAEP-512': RSA_OAEP_512,
};
