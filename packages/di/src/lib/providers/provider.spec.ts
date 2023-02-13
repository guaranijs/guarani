import { isProvider, Provider } from './provider';

describe('Provider', () => {
  const providers: Provider<unknown>[] = [
    { useClass: class {} },
    { useFactory: () => 1 },
    { useToken: 'TOKEN' },
    { useValue: 'Value' },
  ];

  it('should return false when the provider has multiple "use" items.', () => {
    expect(isProvider({ useClass: class {}, useValue: 'Value' })).toBe(false);
  });

  it.each(providers)('should return true when checking a valid provider.', (provider) => {
    expect(isProvider(provider)).toBe(true);
  });
});
