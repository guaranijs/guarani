import { JsonWebEncryptionContentEncryptionAlgorithm } from '../../jsonwebencryption-content-encryption-algorithm.type';
import { A128CBC_HS256, A192CBC_HS384, A256CBC_HS512 } from './cbc.backend';
import { A128GCM, A192GCM, A256GCM } from './gcm.backend';
import { JsonWebEncryptionContentEncryptionBackend } from './jsonwebencryption-content-encryption.backend';

/**
 * JSON Web Encryption Content Encryption Backend Registry.
 */
export const JSONWEBENCRYPTION_CONTENT_ENCRYPTION_REGISTRY: Record<
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionContentEncryptionBackend
> = {
  'A128CBC-HS256': A128CBC_HS256,
  'A192CBC-HS384': A192CBC_HS384,
  'A256CBC-HS512': A256CBC_HS512,
  A128GCM,
  A192GCM,
  A256GCM,
};
