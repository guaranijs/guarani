import { InjectableToken, isInjectableToken } from '../lib/injectable-token';

const invalidTokens: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(0), () => {}, [], {}];
const validTokens: InjectableToken<any>[] = ['TOKEN', Symbol('TOKEN'), class {}];

describe('Injectable Token', () => {
  it.each(invalidTokens)('should return false when the provided object is not a valid injectable token.', (token) => {
    expect(isInjectableToken(token)).toBe(false);
  });

  it.each(validTokens)('should return true when the provided object is a valid injectable token.', (token) => {
    expect(isInjectableToken(token)).toBe(true);
  });
});
