import { Buffer } from 'buffer';

import { InjectableToken, isInjectableToken } from './injectable-token.type';

const invalidTokens: unknown[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(0), () => 1, [], {}];
const validTokens: InjectableToken<unknown>[] = ['TOKEN', Symbol('TOKEN'), class {}];

describe('Injectable Token', () => {
  it.each(invalidTokens)('should return false when the provided object is not a valid injectable token.', (token) => {
    expect(isInjectableToken(token)).toBe(false);
  });

  it.each(validTokens)('should return true when the provided object is a valid injectable token.', (token) => {
    expect(isInjectableToken(token)).toBe(true);
  });
});
