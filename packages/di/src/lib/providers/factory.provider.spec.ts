import { Buffer } from 'buffer';

import { isFactoryProvider } from './factory.provider';
import { Provider } from './provider';

const invalidProviders: any[] = [
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

const invalidFunctions: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), Buffer, [], {}];

const invalidFactoryProviders: Provider<unknown>[] = [
  { useClass: class {} },
  { useToken: Symbol('TOKEN') },
  { useValue: 'Value' },
];

describe('Factory Provider', () => {
  it.each(invalidProviders)('should return false when providing an invalid provider.', (provider) => {
    expect(isFactoryProvider(provider)).toBeFalse();
  });

  it.each(invalidFunctions)('should return false when "useFactory" is not a valid function.', (function_) => {
    expect(isFactoryProvider({ useFactory: function_ })).toBeFalse();
  });

  it.each(invalidFactoryProviders)('should return false when providing an invalid factory provider.', (provider) => {
    expect(isFactoryProvider(provider)).toBeFalse();
  });

  it('should return true when providing a valid factory provider.', () => {
    expect(isFactoryProvider({ useFactory: () => 1 })).toBeTrue();
  });
});
