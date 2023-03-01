import { JsonWebEncryptionCompressionAlgorithm } from '../../jsonwebencryption-compression-algorithm.type';
import { DEF } from './def.backend';
import { JsonWebEncryptionCompressionBackend } from './jsonwebencryption-compression.backend';

/**
 * JSON Web Encryption Compression Backend Registry.
 */
export const JSONWEBENCRYPTION_COMPRESSION_REGISTRY: Record<
  JsonWebEncryptionCompressionAlgorithm,
  JsonWebEncryptionCompressionBackend
> = {
  DEF,
};
