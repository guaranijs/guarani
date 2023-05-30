import 'jest-extended';

import { Buffer } from 'buffer';

import { InjectableToken } from '../types/injectable-token.type';
import { Provider } from './provider';
import { isTokenProvider } from './token.provider';

const invalidProviders: unknown[] = [
  undefined,
  null,
  true,
  1,
  1.2,
  1n,
  'a',
  Symbol('a'),
  Buffer.alloc(0),
  Buffer,
  () => 1,
  [],
];

const invalidTokens: unknown[] = [undefined, null, true, 1, 1.2, 1n, Buffer.alloc(0), () => 1, [], {}];

const invalidTokenProviders: Provider<unknown>[] = [
  { useClass: class {} },
  { useFactory: () => 1 },
  { useValue: 'Value' },
];

const tokens: InjectableToken<unknown>[] = ['TOKEN', Symbol('TOKEN'), class {}];

describe('Token Provider', () => {
  it.each(invalidProviders)('should return false when providing an invalid provider.', (provider) => {
    expect(isTokenProvider(provider)).toBeFalse();
  });

  it.each(invalidTokens)('should return false when "useToken" is not a valid token.', (token) => {
    expect(isTokenProvider({ useToken: token })).toBeFalse();
  });

  it.each(invalidTokenProviders)('should return false when providing an invalid token provider.', (provider) => {
    expect(isTokenProvider(provider)).toBeFalse();
  });

  it.each(tokens)('should return true when providing a valid token provider.', (token) => {
    expect(isTokenProvider({ useToken: token })).toBeTrue();
  });
});
