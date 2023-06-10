import { Buffer } from 'buffer';

import { isClassProvider } from './class.provider';
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

const invalidConstructors: any[] = [undefined, null, true, 1, 1.2, 1n, 'a', Symbol('a'), Buffer.alloc(0), () => 1, []];

const invalidClassProviders: Provider<unknown>[] = [
  { useFactory: () => 1 },
  { useToken: Symbol('TOKEN') },
  { useValue: 'Value' },
];

describe('Class Provider', () => {
  it.each(invalidProviders)('should return false when providing an invalid provider.', (provider) => {
    expect(isClassProvider(provider)).toBeFalse();
  });

  it.each(invalidConstructors)('should return false when "useClass" is not a valid constructor.', (constructor) => {
    expect(isClassProvider({ useClass: constructor })).toBeFalse();
  });

  it.each(invalidClassProviders)('should return false when providing an invalid class provider.', (provider) => {
    expect(isClassProvider(provider)).toBeFalse();
  });

  it('should return true when providing a valid factory provider.', () => {
    expect(isClassProvider({ useClass: class {} })).toBeTrue();
  });
});
