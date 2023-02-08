import { Buffer } from 'buffer';

import { none } from './none.backend';

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature none Backend', () => {
  it('should sign and verify a message.', async () => {
    await expect(none.sign(message)).resolves.toEqual(Buffer.alloc(0));
    await expect(none.verify(Buffer.alloc(0), message)).resolves.not.toThrow();
  });
});
