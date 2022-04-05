import { DEF } from './def';
import { JsonWebEncryptionCompressionAlgorithm } from './jsonwebencryption-compression.algorithm';
import { SupportedJsonWebEncryptionCompressionAlgorithm } from './types/supported-jsonwebencryption-compression-algorithm';

/**
 * JSON Web Encryption Compression Algorithms Registry.
 */
export const JSON_WEB_ENCRYPTION_COMPRESSION_ALGORITHMS_REGISTRY: Record<
  SupportedJsonWebEncryptionCompressionAlgorithm,
  JsonWebEncryptionCompressionAlgorithm
> = {
  DEF: DEF,
};
