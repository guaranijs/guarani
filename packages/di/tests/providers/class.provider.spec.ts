import { isClassProvider } from '../../lib/providers/class.provider';
import { Provider } from '../../lib/providers/provider';

const nonProviders: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), () => {}, []];

describe('Class Provider', () => {
  const invalidCtors: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), () => {}, []];
  const invalidProviders: Provider<any>[] = [{ useFactory: () => {} }, { useToken: 'TOKEN' }, { useValue: 'Value' }];

  it.each(nonProviders)('should return false when not checking a POJO.', (nonProvider) => {
    expect(isClassProvider(nonProvider)).toBe(false);
  });

  it.each(invalidCtors)('should return false when "useClass" is not a valid constructor.', (constructor) => {
    expect(isClassProvider({ useClass: constructor })).toBe(false);
  });

  it.each(invalidProviders)('should return false when the provider is not a class provider.', (provider) => {
    expect(isClassProvider(provider)).toBe(false);
  });

  it('should return true when checking a valid class provider.', () => {
    expect(isClassProvider({ useClass: class {} })).toBe(true);
  });
});
