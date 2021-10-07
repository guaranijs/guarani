import 'reflect-metadata'

import { getContainer } from '../lib/container'
import { Inject, Injectable, InjectAll } from '../lib/decorators'
import { LazyClass01, LazyClass02 } from './fixtures'

const Container = getContainer()

beforeEach(() => Container.clear())

describe('Container', () => {
  it('should be defined.', () => {
    expect(Container).toBeDefined()
  })

  it('should resolve Foo to itself.', () => {
    @Injectable()
    class Foo {}

    Container.bindToken(Foo).toSelf()

    expect(Container.resolve(Foo)).toBeInstanceOf(Foo)
  })

  it('should throw on an unbound token.', () => {
    @Injectable()
    class Foo {}

    Container.bindToken<string>('Foo').toClass(Foo)

    expect(() => Container.resolve(Foo)).toThrow()
  })

  it('should resolve a string token.', () => {
    @Injectable()
    class Foo {}

    Container.bindToken<string>('Foo').toClass(Foo)

    expect(Container.resolve<Foo>('Foo')).toBeInstanceOf(Foo)
  })

  it('should resolve a factory.', () => {
    @Injectable()
    class Foo {}

    Container.bindToken(Foo).toFactory(() => new Foo())

    expect(Container.resolve(Foo)).toBeInstanceOf(Foo)
  })

  it('should resolve an aliased token.', () => {
    @Injectable()
    class Foo {}

    @Injectable()
    class Bar {}

    Container.bindToken(Foo).toSelf()
    Container.bindToken(Bar).toToken(Foo)

    expect(Container.resolve(Bar)).toBeInstanceOf(Foo)
  })

  it('should resolve a value token to the same registered value.', () => {
    @Injectable()
    class Foo {}

    Container.bindToken(Foo).toValue(new Foo())

    expect(Container.resolve(Foo)).toBeInstanceOf(Foo)

    const foo1 = Container.resolve(Foo)
    const foo2 = Container.resolve(Foo)

    expect(foo1).toEqual(foo2)
  })

  it('should resolve multiple assignments to the last one.', () => {
    interface IFoo {}

    @Injectable()
    class Foo1 implements IFoo {}

    @Injectable()
    class Foo2 implements IFoo {}

    Container.bindToken<IFoo>('IFoo').toClass(Foo1)
    Container.bindToken<IFoo>('IFoo').toClass(Foo2)

    expect(Container.resolve<IFoo>('IFoo')).toBeInstanceOf(Foo2)
  })

  it('should always resolve a Singleton into the same instance.', () => {
    @Injectable()
    class Foo {}

    Container.bindToken(Foo).toSelf().asSingleton()

    const foo1 = Container.resolve(Foo)
    const foo2 = Container.resolve(Foo)
    const foo3 = Container.resolve(Foo)

    expect(foo1).toEqual(foo2)
    expect(foo1).toEqual(foo3)
    expect(foo2).toEqual(foo3)
  })

  it('should resolve all the assignments to an array.', () => {
    interface IFoo {}

    @Injectable()
    class Foo1 implements IFoo {}

    @Injectable()
    class Foo2 implements IFoo {}

    Container.bindToken<IFoo>('IFoo').toClass(Foo1)
    Container.bindToken<IFoo>('IFoo').toClass(Foo2)

    const fooArray = Container.resolveAll<IFoo>('IFoo')

    expect(Array.isArray(fooArray)).toBeTruthy()

    expect(fooArray[0]).toBeInstanceOf(Foo1)
    expect(fooArray[1]).toBeInstanceOf(Foo2)
  })

  it('should throw on an unregistered injectable.', () => {
    @Injectable()
    class Foo {}

    expect(() => Container.resolve(Foo)).toThrow()
  })

  it('should inject class dependencies into the constructor.', () => {
    @Injectable()
    class Foo {}

    @Injectable()
    class Bar {
      public constructor(public readonly foo: Foo) {}
    }

    Container.bindToken(Foo).toSelf()
    Container.bindToken(Bar).toSelf()

    expect(Container.resolve(Bar).foo).toBeInstanceOf(Foo)
  })
})

describe('@Inject() decorator', () => {
  it('should inject a dependency based on the provided token.', () => {
    @Injectable()
    class Foo {}

    @Injectable()
    class Bar {
      public constructor(@Inject(Foo) public readonly foo) {}
    }

    Container.bindToken(Foo).toSelf()
    Container.bindToken(Bar).toSelf()

    expect(Container.resolve(Bar).foo).toBeInstanceOf(Foo)
  })

  it('should inject from a string based token.', () => {
    @Injectable()
    class Foo {
      public constructor(@Inject('text') public readonly text: string) {}
    }

    Container.bindToken(Foo).toSelf()
    Container.bindToken<string>('text').toValue('Lorem ipsum...')

    expect(Container.resolve(Foo).text).toEqual('Lorem ipsum...')
  })

  it('should inject the dependeny into a property.', () => {
    @Injectable()
    class Foo {}

    @Injectable()
    class Bar {
      @Inject() public readonly foo: Foo
    }

    Container.bindToken(Foo).toSelf()
    Container.bindToken(Bar).toSelf()

    expect(Container.resolve(Bar).foo).toBeInstanceOf(Foo)
  })
})

describe('@InjectAll() decorator', () => {
  it('should inject all providers into the constructor.', () => {
    interface IFoo {}

    @Injectable()
    class Foo1 implements IFoo {}

    @Injectable()
    class Foo2 implements IFoo {}

    @Injectable()
    class Bar {
      public constructor(@InjectAll('IFoo') public readonly fooArray: IFoo[]) {}
    }

    Container.bindToken<IFoo>('IFoo').toClass(Foo1)
    Container.bindToken<IFoo>('IFoo').toClass(Foo2)

    Container.bindToken(Bar).toSelf()

    const bar = Container.resolve(Bar)

    expect(Array.isArray(bar.fooArray)).toBeTruthy()

    expect(bar.fooArray[0]).toBeInstanceOf(Foo1)
    expect(bar.fooArray[1]).toBeInstanceOf(Foo2)
  })

  it('should inject all instances of IRunner into the property.', () => {
    interface IFoo {}

    @Injectable()
    class Foo1 implements IFoo {}

    @Injectable()
    class Foo2 implements IFoo {}

    @Injectable()
    class Bar {
      @InjectAll('IFoo') public readonly fooArray: IFoo[]
    }

    Container.bindToken<IFoo>('IFoo').toClass(Foo1)
    Container.bindToken<IFoo>('IFoo').toClass(Foo2)

    Container.bindToken(Bar).toSelf()

    const bar = Container.resolve(Bar)

    expect(Array.isArray(bar.fooArray)).toBeTruthy()

    expect(bar.fooArray[0]).toBeInstanceOf(Foo1)
    expect(bar.fooArray[1]).toBeInstanceOf(Foo2)
  })
})

describe('@LazyInject() decorator', () => {
  it('should delay the injection of wrapped constructors.', () => {
    Container.bindToken(LazyClass01).toSelf()
    Container.bindToken(LazyClass02).toSelf()

    const l1 = Container.resolve(LazyClass01)
    const l2 = Container.resolve(LazyClass02)

    expect(l1.l2).toBeInstanceOf(LazyClass02)
    expect(l2.l1).toBeInstanceOf(LazyClass01)
  })
})
