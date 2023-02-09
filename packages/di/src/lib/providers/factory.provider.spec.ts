import { Buffer } from 'buffer';

import { isFactoryProvider } from './factory.provider';
import { Provider } from './provider';

const nonProviders: unknown[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), () => 1, []];

describe('Factory Provider', () => {
  const invalidFuncs: unknown[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), [], {}, Array];
  const invalidProviders: Provider<unknown>[] = [{ useClass: class {} }, { useToken: 'TOKEN' }, { useValue: 'Value' }];

  it.each(nonProviders)('should return false when not checking a POJO.', (nonProvider) => {
    expect(isFactoryProvider(nonProvider)).toBe(false);
  });

  it.each(invalidFuncs)('should return false when "useFactory" is not a valid constructor.', (func) => {
    expect(isFactoryProvider({ useFactory: func })).toBe(false);
  });

  it.each(invalidProviders)('should return false when the provider is not a factory provider.', (provider) => {
    expect(isFactoryProvider(provider)).toBe(false);
  });

  it('should return true when checking a valid factory provider.', () => {
    expect(isFactoryProvider({ useFactory: () => 1 })).toBe(true);
  });
});
