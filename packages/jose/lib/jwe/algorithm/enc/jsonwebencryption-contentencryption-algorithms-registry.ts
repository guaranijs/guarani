import { SupportedJsonWebEncryptionContentEncryptionAlgorithm } from './supported-jsonwebencryption-contentencryption-algorithm';
import { A128CBC_HS256, A192CBC_HS384, A256CBC_HS512 } from './cbc';
import { A128GCM, A192GCM, A256GCM } from './gcm';
import { JsonWebEncryptionContentEncryptionAlgorithm } from './jsonwebencryption-contentencryption.algorithm';

/**
 * JSON Web Encryption Content Encryption Algorithms Registry.
 */
export const JSON_WEB_ENCRYPTION_CONTENT_ENCRYPTION_ALGORITHMS_REGISTRY: Record<
  SupportedJsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionContentEncryptionAlgorithm
> = {
  'A128CBC-HS256': A128CBC_HS256,
  'A192CBC-HS384': A192CBC_HS384,
  'A256CBC-HS512': A256CBC_HS512,
  A128GCM: A128GCM,
  A192GCM: A192GCM,
  A256GCM: A256GCM,
};
