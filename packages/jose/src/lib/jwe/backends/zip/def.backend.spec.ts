import { Buffer } from 'buffer';

import { JsonWebEncryptionCompressionAlgorithm } from '../../jsonwebencryption-compression-algorithm.type';
import { DEF } from './def.backend';

const plaintext = Buffer.from('Super secret message.', 'utf8');

describe('JSON Web Encryption DEFLATE Compression Algorithm', () => {
  it('should have "DEF" as its algorithm.', () => {
    expect(DEF['algorithm']).toEqual<JsonWebEncryptionCompressionAlgorithm>('DEF');
  });

  it('should compress and decompress a plaintext.', async () => {
    let compressed!: Buffer;

    await expect((async () => (compressed = await DEF.compress(plaintext)))()).resolves.toEqual(expect.any(Buffer));
    await expect(DEF.decompress(compressed)).resolves.toEqual(plaintext);
  });
});
