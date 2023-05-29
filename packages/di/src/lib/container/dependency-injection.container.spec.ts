import 'reflect-metadata';

import { ProviderBinding } from '../bindings/provider.binding';
import { Inject } from '../decorators/inject.decorator';
import { InjectAll } from '../decorators/inject-all.decorator';
import { Injectable } from '../decorators/injectable.decorator';
import { Optional } from '../decorators/optional.decorator';
import { ResolutionException } from '../exceptions/resolution.exception';
import { TokenNotRegisteredException } from '../exceptions/token-not-registered.exception';
import { LazyToken } from '../types/lazy-token';
import { LazyClass01Stub } from './__stubs__/lazy-class-01.stub';
import { LazyClass02Stub } from './__stubs__/lazy-class-02.stub';
import { LazyClass03Stub } from './__stubs__/lazy-class-03.stub';
import { LazyClass04Stub } from './__stubs__/lazy-class-04.stub';
import { DependencyInjectionContainer } from './dependency-injection.container';
import { DependencyInjectionRegistry } from './dependency-injection.registry';

const TOKEN = Symbol('TOKEN');

describe('Dependency Injection Container', () => {
  let container: DependencyInjectionContainer;

  beforeEach(() => {
    container = new DependencyInjectionContainer();
  });

  describe('registry', () => {
    it('should be an instance of "Registry".', () => {
      expect(container['registry']).toBeInstanceOf(DependencyInjectionRegistry);
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

    it('should resolve an abstract class provider.', () => {
      abstract class Foo {}

      @Injectable()
      class Foo1 extends Foo {}

      container.bind(Foo).toClass(Foo1);

      expect(container.resolve(Foo)).toBeInstanceOf(Foo);
      expect(container.resolve(Foo)).toBeInstanceOf(Foo1);
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
      // eslint-disable-next-line @typescript-eslint/no-empty-interface
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

    it('should inject "undefined" when a token is not registered and the constructor descriptor is marked as optional.', () => {
      @Injectable()
      class Foo {
        public constructor(
          @Inject('Issuer') public readonly issuer: string,
          @Optional() @Inject('Value') public readonly value?: number
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

    it('should inject "undefined" when a token is not registered and the property descriptor is marked as optional.', () => {
      @Injectable()
      class Foo {
        @Optional()
        @Inject('Value')
        public readonly value?: number;

        public constructor(@Inject('Issuer') public readonly issuer: string) {}
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
      let l1!: LazyClass01Stub;
      let l2!: LazyClass02Stub;

      container.bind<string>('Host').toValue('https://example.com');
      container.bind(LazyClass01Stub).toSelf();
      container.bind(LazyClass02Stub).toSelf();

      expect(() => (l1 = container.resolve(LazyClass01Stub))).not.toThrow();
      expect(() => (l2 = container.resolve(LazyClass02Stub))).not.toThrow();

      expect(l1.l2).toBeInstanceOf(LazyClass02Stub);
      expect(l2.l1).toBeInstanceOf(LazyClass01Stub);
    });

    it('should inject "undefined" when injecting optional circular dependencies with the @LazyInject() decorator.', () => {
      let l3!: LazyClass03Stub;
      let l4!: LazyClass04Stub;

      container.bind<string>('Host').toValue('https://example.com');
      container.bind(LazyClass03Stub).toSelf();
      container.bind(LazyClass04Stub).toSelf();

      expect(() => (l3 = container.resolve(LazyClass03Stub))).not.toThrow();
      expect(() => (l4 = container.resolve(LazyClass04Stub))).not.toThrow();

      expect(l3.l4).toBeUndefined();
      expect(l4.l3).toBeUndefined();
    });

    it('should always resolve a singleton token to the same instance.', () => {
      @Injectable()
      class Foo {}

      container.bind(Foo).toSelf().asSingleton();
      expect(container['registry']['bindings'].get(Foo)?.at(-1)?.singleton).toBeUndefined();

      const foo1 = container.resolve(Foo);
      expect(container['registry']['bindings'].get(Foo)?.at(-1)?.singleton).toBe(foo1);

      const foo2 = container.resolve(Foo);
      expect(container['registry']['bindings'].get(Foo)?.at(-1)?.singleton).toBe(foo1);

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
      container.bind(Bar).toSelf().asRequest();
      container.bind(Baz).toSelf().asRequest();

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
      container.bind(Bar).toSelf().asTransient();
      container.bind(Baz).toSelf().asTransient();

      const baz1 = container.resolve(Baz);
      const baz2 = container.resolve(Baz);

      expect(baz1.foo).not.toBe(baz1.bar.foo);
      expect(baz2.foo).not.toBe(baz2.bar.foo);

      expect(baz1.foo).not.toBe(baz2.bar.foo);
      expect(baz2.foo).not.toBe(baz1.bar.foo);

      expect(baz1.foo).not.toBe(baz2.foo);
      expect(baz1.bar.foo).not.toBe(baz2.bar.foo);
    });

    it('should inject a singleton dependency into a request resolution.', () => {
      @Injectable()
      class Foo {}

      @Injectable()
      class Bar {
        public constructor(public readonly foo: Foo) {}
      }

      container.bind(Foo).toSelf();
      container.bind(Bar).toSelf().asRequest();

      const bar1 = container.resolve(Bar);
      const bar2 = container.resolve(Bar);

      expect(bar1.foo).toBe(bar2.foo);
    });

    it('should inject a singleton dependency into a transient resolution.', () => {
      @Injectable()
      class Foo {}

      @Injectable()
      class Bar {
        public constructor(public readonly foo: Foo) {}
      }

      container.bind(Foo).toSelf();
      container.bind(Bar).toSelf().asTransient();

      const bar1 = container.resolve(Bar);
      const bar2 = container.resolve(Bar);

      expect(bar1.foo).toBe(bar2.foo);
    });

    it('should inject a request dependency into a transient resolution.', () => {
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
      container.bind(Bar).toSelf().asRequest();
      container.bind(Baz).toSelf().asTransient();

      const baz1 = container.resolve(Baz);
      const baz2 = container.resolve(Baz);

      expect(baz1.foo).toBe(baz1.bar.foo);
      expect(baz1.foo).not.toBe(baz2.foo);
    });

    it('should inject all the instances of a token.', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-interface
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
