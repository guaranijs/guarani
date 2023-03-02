import { Buffer } from 'buffer';

import { JsonWebEncryptionCompressionAlgorithm } from '../../jsonwebencryption-compression-algorithm.type';
import { DEF } from './def.backend';

const plaintext = Buffer.from('Super secret message.', 'utf8');

describe('JSON Web Encryption DEFLATE Compression Algorithm', () => {
  it('should have "DEF" as its algorithm.', () => {
    expect(DEF['algorithm']).toEqual<JsonWebEncryptionCompressionAlgorithm>('DEF');
  });

  it('should compress a plaintext.', async () => {
    let compressed!: Buffer;

    await expect((async () => (compressed = await DEF.compress(plaintext)))()).resolves.not.toThrow();
    expect(compressed.toString('base64url')).toEqual('Cy4tSC1SKE5NLkotUchNLS5OTE_VAwA');
  });

  it('should decompress a compressed plaintext.', async () => {
    let decompressed!: Buffer;

    const compressed = Buffer.from('Cy4tSC1SKE5NLkotUchNLS5OTE_VAwA', 'base64url');

    await expect((async () => (decompressed = await DEF.decompress(compressed)))()).resolves.not.toThrow();
    expect(decompressed).toEqual(plaintext);
  });
});
