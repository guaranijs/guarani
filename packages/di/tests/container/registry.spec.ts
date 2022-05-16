import { Binding } from '../../lib/bindings/binding';
import { Registry } from '../../lib/container/registry';
import { TokenNotRegisteredException } from '../../lib/exceptions/token-not-registered.exception';

const registry = new Registry();

describe('Registry', () => {
  beforeEach(() => {
    registry.clear();
  });

  it('should add a token entry to the registry.', () => {
    const binding = Object.assign(new Binding<string>('TOKEN'), { provider: { useValue: 'foo' } });

    expect(registry.has<string>('Foo')).toBe(false);
    expect(() => registry.set<string>('Foo', binding)).not.toThrow();
    expect(registry.has<string>('Foo')).toBe(true);
  });

  it('should return the only entry of a token from the registry.', () => {
    const binding = Object.assign(new Binding<string>('TOKEN'), { provider: { useValue: 'foo' } });

    registry.set<string>('Foo', binding);

    expect(registry.get<string>('Foo')).toStrictEqual<Binding<string>>(binding);
  });

  it('should return the last entry of a token from the registry.', () => {
    const binding1 = Object.assign(new Binding<string>('TOKEN'), { provider: { useValue: 'foo1' } });
    const binding2 = Object.assign(new Binding<string>('TOKEN'), { provider: { useValue: 'foo2' } });

    registry.set<string>('Foo', binding1);
    registry.set<string>('Foo', binding2);

    expect(registry.get<string>('Foo')).toStrictEqual<Binding<string>>(binding2);
  });

  it('should return all the entries of a token from the registry.', () => {
    const binding1 = Object.assign(new Binding<string>('TOKEN'), { provider: { useValue: 'foo1' } });
    const binding2 = Object.assign(new Binding<string>('TOKEN'), { provider: { useValue: 'foo2' } });

    registry.set<string>('Foo', binding1);
    registry.set<string>('Foo', binding2);

    expect(registry.getAll<string>('Foo')).toStrictEqual<Binding<string>[]>([binding1, binding2]);
  });

  it('should reject when the requested token is not registered.', () => {
    expect(() => registry.get<string>('Foo')).toThrow(TokenNotRegisteredException);
    expect(() => registry.getAll<string>('Foo')).toThrow(TokenNotRegisteredException);
  });

  it('should remove an entry of a token from the registry.', () => {
    const binding = Object.assign(new Binding<string>('TOKEN'), { provider: { useValue: 'foo' } });

    registry.set<string>('Foo', binding);
    expect(registry.has<string>('Foo')).toBe(true);

    registry.delete<string>('Foo');
    expect(registry.has<string>('Foo')).toBe(false);
  });
});
