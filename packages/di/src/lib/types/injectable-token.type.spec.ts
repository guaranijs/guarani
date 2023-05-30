import 'jest-extended';

import { Buffer } from 'buffer';

import { InjectableToken, isInjectableToken } from './injectable-token.type';

const invalidTokens: unknown[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(0), () => 1, [], {}];
const validTokens: InjectableToken<unknown>[] = ['TOKEN', Symbol('TOKEN'), class {}];

describe('Injectable Token', () => {
  it.each(invalidTokens)('should return false when providing an invalid injectable token.', (token) => {
    expect(isInjectableToken(token)).toBeFalse();
  });

  it.each(validTokens)('should return true when providing a valid injectable token.', (token) => {
    expect(isInjectableToken(token)).toBeTrue();
  });
});
