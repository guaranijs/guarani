import 'jest-extended';

import { Binding } from '../bindings/binding';
import { TokenNotRegisteredException } from '../exceptions/token-not-registered.exception';
import { DependencyInjectionRegistry } from './dependency-injection.registry';

describe('Dependency Injection Registry', () => {
  let registry: DependencyInjectionRegistry;

  beforeEach(() => {
    registry = new DependencyInjectionRegistry();
  });

  describe('set()', () => {
    it('should add a binding to the registry.', () => {
      const binding = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo' } });

      expect(registry['bindings'].has('Foo')).toBeFalse();
      expect(registry['bindings'].get('Foo')).toBeUndefined();

      registry.set<string>('Foo', binding);

      expect(registry['bindings'].has('Foo')).toBeTrue();
      expect(registry['bindings'].get('Foo')).toEqual<Binding<string>[]>([binding]);
    });

    it('should add multiple bindings under the same token to the registry.', () => {
      const binding1 = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo' } });
      const binding2 = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'bar' } });

      expect(registry['bindings'].has('Foo')).toBeFalse();
      expect(registry['bindings'].get('Foo')).toBeUndefined();

      registry.set<string>('Foo', binding1);
      registry.set<string>('Foo', binding2);

      expect(registry['bindings'].has('Foo')).toBeTrue();
      expect(registry['bindings'].get('Foo')).toEqual<Binding<string>[]>([binding1, binding2]);
    });
  });

  describe('get()', () => {
    it('should throw when the requested token is not registered.', () => {
      expect(() => registry.get<string>('Foo')).toThrow(new TokenNotRegisteredException('Foo'));
    });

    it('should return the only entry of a token from the registry.', () => {
      const binding = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo' } });

      registry.set<string>('Foo', binding);

      expect(registry.get<string>('Foo')).toBe<Binding<string>>(binding);
    });

    it('should return the last entry of a token from the registry.', () => {
      const binding1 = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo1' } });
      const binding2 = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo2' } });

      registry.set<string>('Foo', binding1);
      registry.set<string>('Foo', binding2);

      expect(registry.get<string>('Foo')).toBe<Binding<string>>(binding2);
    });
  });

  describe('getAll()', () => {
    it('should reject when the requested token is not registered.', () => {
      expect(() => registry.getAll<string>('Foo')).toThrow(new TokenNotRegisteredException('Foo'));
    });

    it('should return all the entries of a token from the registry.', () => {
      const binding1 = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo1' } });
      const binding2 = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo2' } });

      registry.set<string>('Foo', binding1);
      registry.set<string>('Foo', binding2);

      expect(registry.getAll<string>('Foo')).toEqual<Binding<string>[]>([binding1, binding2]);
    });
  });

  describe('has()', () => {
    it('should return false when the provided token is not registered.', () => {
      expect(registry.has<string>('Foo')).toBeFalse();
    });

    it('should return true when the provided token is registered.', () => {
      const binding = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo1' } });
      registry.set<string>('Foo', binding);
      expect(registry.has<string>('Foo')).toBeTrue();
    });
  });

  describe('delete()', () => {
    it('should remove a token from the registry.', () => {
      const binding = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo' } });
      expect(registry.has<string>('Foo')).toBeFalse();

      registry.set<string>('Foo', binding);
      expect(registry.has<string>('Foo')).toBeTrue();

      registry.delete<string>('Foo');
      expect(registry.has<string>('Foo')).toBeFalse();
    });
  });

  describe('clear()', () => {
    it('should remove a token from the registry.', () => {
      const binding1 = Object.assign(new Binding<string>('Foo'), { provider: { useValue: 'foo' } });
      const binding2 = Object.assign(new Binding<string>('Bar'), { provider: { useValue: 'foo' } });
      const binding3 = Object.assign(new Binding<string>('Baz'), { provider: { useValue: 'foo' } });

      expect(registry.has<string>('Foo')).toBeFalse();
      expect(registry.has<string>('Bar')).toBeFalse();
      expect(registry.has<string>('Baz')).toBeFalse();

      registry.set<string>('Foo', binding1);
      registry.set<string>('Bar', binding2);
      registry.set<string>('Baz', binding3);

      expect(registry.has<string>('Foo')).toBeTrue();
      expect(registry.has<string>('Bar')).toBeTrue();
      expect(registry.has<string>('Baz')).toBeTrue();

      console.log(registry['bindings']);

      registry.clear();

      expect(registry.has<string>('Foo')).toBeFalse();
      expect(registry.has<string>('Bar')).toBeFalse();
      expect(registry.has<string>('Baz')).toBeFalse();
    });
  });
});
