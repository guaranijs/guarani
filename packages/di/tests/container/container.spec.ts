import { Optional } from '@guarani/types';

import { ProviderBinding } from '../../lib/bindings/provider.binding';
import { DIContainer } from '../../lib/container/container';
import { Registry } from '../../lib/container/registry';
import { Inject } from '../../lib/decorators/inject';
import { InjectAll } from '../../lib/decorators/inject-all';
import { Injectable } from '../../lib/decorators/injectable';
import { ResolutionException } from '../../lib/exceptions/resolution.exception';
import { TokenNotRegisteredException } from '../../lib/exceptions/token-not-registered.exception';
import { LazyToken } from '../../lib/lazy-token';
import { LazyClass01Fixture } from './fixtures/lazy-class-01.fixture';
import { LazyClass02Fixture } from './fixtures/lazy-class-02.fixture';
import { LazyClass03Fixture } from './fixtures/lazy-class-03.fixture';
import { LazyClass04Fixture } from './fixtures/lazy-class-04.fixture';

const TOKEN = Symbol('TOKEN');
const container = new DIContainer();

describe('Dependency Injection Container', () => {
  beforeEach(() => {
    container.clear();
  });

  describe('registry', () => {
    it('should be an instance of "Registry".', () => {
      expect(container['registry']).toBeInstanceOf(Registry);
    });
  });

  describe('bind()', () => {
    it('should register a token at the container.', () => {
      expect(container['registry'].has(TOKEN)).toBe(false);
      expect(container.bind(TOKEN)).toBeInstanceOf(ProviderBinding);
      expect(container['registry'].has(TOKEN)).toBe(true);
    });
  });

  describe('isRegistered()', () => {
    it('should return false when a token is not registered at the container.', () => {
      expect(container.isRegistered(TOKEN)).toBe(false);
    });

    it('should return true when a token is registered at the container.', () => {
      container.bind(TOKEN).toValue('TOKEN_VALUE');
      expect(container.isRegistered(TOKEN)).toBe(true);
    });
  });

  describe('resolve()', () => {
    it('should reject when the token is not registered.', () => {
      expect(() => container.resolve('Unbound')).toThrow(TokenNotRegisteredException);
    });

    it('should resolve a value provider.', () => {
      container.bind<string>('Issuer').toValue('https://example.com');
      expect(container.resolve<string>('Issuer')).toBe('https://example.com');
    });

    it('should resolve a token provider.', () => {
      container.bind<string>('Issuer').toValue('https://example.com');
      container.bind<string>('OldIssuer').toToken('Issuer');

      expect(container.resolve<string>('OldIssuer')).toBe('https://example.com');
    });

    it('should resolve a factory provider.', () => {
      const user = { name: 'John Doe' };
      container.bind<string>('Name').toFactory(() => user.name);
      expect(container.resolve<string>('Name')).toBe('John Doe');
    });

    it('should resolve a class provider.', () => {
      @Injectable()
      class Foo {}

      container.bind(Foo).toSelf();

      expect(container.resolve(Foo)).toBeInstanceOf(Foo);
    });

    it('should resolve multiple value requests to the same value.', () => {
      @Injectable()
      class Foo {}

      container.bind(Foo).toValue(new Foo());

      expect(container.resolve(Foo)).toBeInstanceOf(Foo);

      const foo1 = container.resolve(Foo);
      const foo2 = container.resolve(Foo);

      expect(foo1).toBe(foo2);
    });

    it('should resolve multiple assignments to the last one.', () => {
      interface Foo {}

      @Injectable()
      class Foo1 implements Foo {}

      @Injectable()
      class Foo2 implements Foo {}

      container.bind<Foo>('Foo').toClass(Foo1);
      container.bind<Foo>('Foo').toClass(Foo2);

      expect(container.resolve<Foo>('Foo')).toBeInstanceOf(Foo2);
    });

    it('should inject a dependency into the constructor.', () => {
      @Injectable()
      class Foo {}

      @Injectable()
      class Bar {
        public constructor(public readonly foo: Foo) {}
      }

      container.bind(Foo).toSelf();
      container.bind(Bar).toSelf();

      let bar!: Bar;

      expect(() => (bar = container.resolve(Bar))).not.toThrow();
      expect(bar).toBeInstanceOf(Bar);
      expect(bar.foo).toBeInstanceOf(Foo);
    });

    it('should inject a dependency into a property of the class.', () => {
      @Injectable()
      class Foo {}

      @Injectable()
      class Bar {
        @Inject()
        public readonly foo!: Foo;
      }

      container.bind(Foo).toSelf();
      container.bind(Bar).toSelf();

      let bar!: Bar;

      expect(() => (bar = container.resolve(Bar))).not.toThrow();
      expect(bar).toBeInstanceOf(Bar);
      expect(bar.foo).toBeInstanceOf(Foo);
    });

    it('should inject a dependency based on the provided token over the infered type.', () => {
      @Injectable()
      class Foo {}

      @Injectable()
      class Bar {}

      @Injectable()
      class Baz {
        public constructor(@Inject(Bar) public readonly foo: Foo) {}
      }

      container.bind(Foo).toSelf();
      container.bind(Bar).toSelf();
      container.bind(Baz).toSelf();

      let baz!: Baz;

      expect(() => (baz = container.resolve(Baz))).not.toThrow();
      expect(baz).toBeInstanceOf(Baz);
      expect(baz.foo).toBeInstanceOf(Bar);
    });

    it('should inject a dependency based on the provided token.', () => {
      @Injectable()
      class Foo {
        public constructor(@Inject('Issuer') public readonly issuer: string) {}
      }

      container.bind(Foo).toSelf();
      container.bind<string>('Issuer').toValue('https://example.com');

      let foo!: Foo;

      expect(() => (foo = container.resolve(Foo))).not.toThrow();
      expect(foo).toBeInstanceOf(Foo);
      expect(foo.issuer).toBe('https://example.com');
    });

    it('should inject "undefined" when a token is not registered and the descriptor is marked as optional.', () => {
      @Injectable()
      class Foo {
        public constructor(
          @Inject('Issuer') public readonly issuer: string,
          @Inject('Value', true) public readonly value?: Optional<number>
        ) {}
      }

      container.bind(Foo).toSelf();
      container.bind<string>('Issuer').toValue('https://example.com');

      let foo!: Foo;

      expect(() => (foo = container.resolve(Foo))).not.toThrow();
      expect(foo).toBeInstanceOf(Foo);
      expect(foo.issuer).toBe('https://example.com');
      expect(foo.value).toBeUndefined();
    });

    it('should correctly resolve when injecting circular dependencies with the @LazyInject() decorator.', () => {
      let l1!: LazyClass01Fixture;
      let l2!: LazyClass02Fixture;

      container.bind<string>('Host').toValue('https://example.com');
      container.bind(LazyClass01Fixture).toSelf();
      container.bind(LazyClass02Fixture).toSelf();

      expect(() => (l1 = container.resolve(LazyClass01Fixture))).not.toThrow();
      expect(() => (l2 = container.resolve(LazyClass02Fixture))).not.toThrow();

      expect(l1.l2).toBeInstanceOf(LazyClass02Fixture);
      expect(l2.l1).toBeInstanceOf(LazyClass01Fixture);
    });

    it('should inject "undefined" when injecting optional circular dependencies with the @LazyInject() decorator.', () => {
      let l3!: LazyClass03Fixture;
      let l4!: LazyClass04Fixture;

      container.bind<string>('Host').toValue('https://example.com');
      container.bind(LazyClass03Fixture).toSelf();
      container.bind(LazyClass04Fixture).toSelf();

      expect(() => (l3 = container.resolve(LazyClass03Fixture))).not.toThrow();
      expect(() => (l4 = container.resolve(LazyClass04Fixture))).not.toThrow();

      expect(l3.l4).toBeUndefined();
      expect(l4.l3).toBeUndefined();
    });

    it('should always resolve a singleton token to the same instance.', () => {
      @Injectable()
      class Foo {}

      container.bind(Foo).toSelf().asSingleton();
      expect(container['registry']['bindings'].get(Foo)!.at(-1)!.singleton).toBeUndefined();

      const foo1 = container.resolve(Foo);
      expect(container['registry']['bindings'].get(Foo)!.at(-1)!.singleton).toBe(foo1);

      const foo2 = container.resolve(Foo);
      expect(container['registry']['bindings'].get(Foo)!.at(-1)!.singleton).toBe(foo1);

      expect(foo1).toBe(foo2);
    });

    it('should resolve a request token to the same instance on the same resolution chain.', () => {
      @Injectable()
      class Foo {}

      @Injectable()
      class Bar {
        public constructor(public readonly foo: Foo) {}
      }

      @Injectable()
      class Baz {
        public constructor(public readonly foo: Foo, public readonly bar: Bar) {}
      }

      container.bind(Foo).toSelf().asRequest();
      container.bind(Bar).toSelf();
      container.bind(Baz).toSelf();

      const baz1 = container.resolve(Baz);
      const baz2 = container.resolve(Baz);

      expect(baz1.foo).toBe(baz1.bar.foo);
      expect(baz2.foo).toBe(baz2.bar.foo);

      expect(baz1.foo).not.toBe(baz2.foo);
      expect(baz1.bar.foo).not.toBe(baz2.bar.foo);
    });

    it('should resolve a transient token to a new instance on every resolution.', () => {
      @Injectable()
      class Foo {}

      @Injectable()
      class Bar {
        public constructor(public readonly foo: Foo) {}
      }

      @Injectable()
      class Baz {
        public constructor(public readonly foo: Foo, public readonly bar: Bar) {}
      }

      container.bind(Foo).toSelf().asTransient();
      container.bind(Bar).toSelf();
      container.bind(Baz).toSelf();

      const baz1 = container.resolve(Baz);
      const baz2 = container.resolve(Baz);

      expect(baz1.foo).not.toBe(baz1.bar.foo);
      expect(baz2.foo).not.toBe(baz2.bar.foo);

      expect(baz1.foo).not.toBe(baz2.bar.foo);
      expect(baz2.foo).not.toBe(baz1.bar.foo);

      expect(baz1.foo).not.toBe(baz2.foo);
      expect(baz1.bar.foo).not.toBe(baz2.bar.foo);
    });

    it('should inject all the instances of a token.', () => {
      interface Foo {}

      @Injectable()
      class Foo1 implements Foo {}

      @Injectable()
      class Foo2 implements Foo {}

      @Injectable()
      class Bar {
        public constructor(@InjectAll('Foo') public readonly foos: Foo[]) {}
      }

      container.bind<Foo>('Foo').toClass(Foo1);
      container.bind<Foo>('Foo').toClass(Foo2);
      container.bind(Bar).toSelf();

      let bar!: Bar;

      expect(() => (bar = container.resolve(Bar))).not.toThrow();

      expect(bar.foos).toBeInstanceOf(Array);
      expect(bar.foos[0]).toBeInstanceOf(Foo1);
      expect(bar.foos[1]).toBeInstanceOf(Foo2);
    });
  });

  // TODO: Add more tests.
  describe('resolveAll()', () => {
    it('should reject when the token is a lazy token.', () => {
      expect(() => container.resolveAll(new LazyToken(() => class {}))).toThrow(ResolutionException);
    });

    it('should reject when the token is not registered.', () => {
      expect(() => container.resolveAll('Unbound')).toThrow(TokenNotRegisteredException);
    });
  });

  describe('delete()', () => {
    it('should ignore when removing an unregistered token from the container.', () => {
      expect(() => container.delete(TOKEN)).not.toThrow();
      expect(container['registry'].has(TOKEN)).toBe(false);
    });

    it('should remove a token from the container.', () => {
      container.bind(TOKEN);
      expect(container['registry'].has(TOKEN)).toBe(true);

      container.delete(TOKEN);
      expect(container['registry'].has(TOKEN)).toBe(false);
    });
  });
});
