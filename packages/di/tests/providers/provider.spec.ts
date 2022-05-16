import { isProvider, Provider } from '../../lib/providers/provider';

describe('Provider', () => {
  const providers: Provider<any>[] = [
    { useClass: class {} },
    { useFactory: () => {} },
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
