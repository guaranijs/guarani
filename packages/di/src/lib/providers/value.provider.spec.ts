import { Buffer } from 'buffer';

import { Provider } from './provider';
import { isValueProvider } from './value.provider';

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

const invalidValueProviders: Provider<unknown>[] = [
  { useClass: class {} },
  { useFactory: () => 1 },
  { useToken: Symbol('TOKEN') },
];

const values: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), Buffer, () => 1, [], {}];

describe('Value Provider', () => {
  it.each(invalidProviders)('should return false when providing an invalid provider.', (provider) => {
    expect(isValueProvider(provider)).toBeFalse();
  });

  it('should return false when "useValue" is not present in the provider.', () => {
    expect(isValueProvider({})).toBeFalse();
  });

  it.each(invalidValueProviders)('should return false when providing an invalid value provider.', (provider) => {
    expect(isValueProvider(provider)).toBeFalse();
  });

  it.each(values)('should return true when providing a valid value provider.', (value) => {
    expect(isValueProvider({ useValue: value })).toBeTrue();
  });
});
