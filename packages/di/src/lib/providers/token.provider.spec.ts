import { Buffer } from 'buffer';

import { Provider } from './provider';
import { isTokenProvider } from './token.provider';

const nonProviders: unknown[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), () => 1, []];

describe('Token Provider', () => {
  const invalidTokens: unknown[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(0), () => 1, [], {}];
  const invalidProviders: Provider<unknown>[] = [
    { useClass: class {} },
    { useFactory: () => 1 },
    { useValue: 'Value' },
  ];

  it.each(nonProviders)('should return false when not checking a POJO.', (nonProvider) => {
    expect(isTokenProvider(nonProvider)).toBe(false);
  });

  it.each(invalidTokens)('should return false when "useToken" is not a valid token.', (token) => {
    expect(isTokenProvider({ useToken: token })).toBe(false);
  });

  it.each(invalidProviders)('should return false when the provider is not a token provider.', (provider) => {
    expect(isTokenProvider(provider)).toBe(false);
  });

  it('should return true when checking a valid token provider.', () => {
    expect(isTokenProvider({ useToken: 'TOKEN' })).toBe(true);
    expect(isTokenProvider({ useToken: Symbol('TOKEN') })).toBe(true);
    expect(isTokenProvider({ useToken: class {} })).toBe(true);
  });
});
