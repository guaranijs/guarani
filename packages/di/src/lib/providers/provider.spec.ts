import { isProvider, Provider } from './provider';

const providers: Provider<unknown>[] = [
  { useClass: class {} },
  { useFactory: () => 1 },
  { useToken: Symbol('TOKEN') },
  { useValue: 'Value' },
];

describe('Provider', () => {
  it('should return false when the provider has multiple "use" items.', () => {
    expect(isProvider({ useClass: class {}, useValue: 'Value' })).toBe(false);
  });

  it.each(providers)('should return true when checking a valid provider.', (provider) => {
    expect(isProvider(provider)).toBe(true);
  });
});
