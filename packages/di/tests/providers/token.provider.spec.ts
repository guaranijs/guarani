import { Provider } from '../../lib/providers/provider';
import { isTokenProvider } from '../../lib/providers/token.provider';

const nonProviders: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), () => {}, []];

describe('Token Provider', () => {
  const invalidTokens: any[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(0), () => {}, [], {}];
  const invalidProviders: Provider<any>[] = [{ useClass: class {} }, { useFactory: () => {} }, { useValue: 'Value' }];

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
