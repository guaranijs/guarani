import { Provider } from '../../lib/providers/provider';
import { isValueProvider } from '../../lib/providers/value.provider';

const nonProviders: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), () => {}, []];

describe('Value Provider', () => {
  class A {}

  const invalidProviders: Provider<any>[] = [{ useClass: class {} }, { useFactory: () => {} }, { useToken: 'TOKEN' }];
  const values: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), () => {}, [], {}, A];

  it.each(nonProviders)('should return false when not checking a POJO.', (nonProvider) => {
    expect(isValueProvider(nonProvider)).toBe(false);
  });

  it('should return false when "useValue" is not present in the provider.', () => {
    expect(isValueProvider({})).toBe(false);
  });

  it.each(invalidProviders)('should return false when the provider is not a value provider.', (provider) => {
    expect(isValueProvider(provider)).toBe(false);
  });

  it.each(values)('should return true when checking a valid value provider.', (value) => {
    expect(isValueProvider({ useValue: value })).toBe(true);
  });
});
