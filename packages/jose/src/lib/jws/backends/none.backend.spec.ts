import { Buffer } from 'buffer';

import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { none } from './none.backend';

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature none Backend', () => {
  it('should have "none" as its algorithm.', () => {
    expect(none['algorithm']).toEqual<JsonWebSignatureAlgorithm>('none');
  });

  it('should sign and verify a message.', async () => {
    await expect(none.sign(message)).resolves.toEqual(Buffer.alloc(0));
    await expect(none.verify(Buffer.alloc(0), message)).resolves.not.toThrow();
  });
});
