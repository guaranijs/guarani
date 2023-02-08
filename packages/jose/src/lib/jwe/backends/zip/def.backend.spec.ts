import { Buffer } from 'buffer';

import { DEF } from './def.backend';

const plaintext = Buffer.from('Super secret message.', 'utf8');

describe('JSON Web Encryption DEFLATE Compression Algorithm', () => {
  it('should compress and decompress a plaintext.', async () => {
    let compressed!: Buffer;

    expect((compressed = await DEF.compress(plaintext))).toEqual(expect.any(Buffer));
    await expect(DEF.decompress(compressed)).resolves.toEqual(plaintext);
  });
});
