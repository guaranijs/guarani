import 'reflect-metadata'

import { Container } from '../lib/container'
import { Inject, Injectable, InjectAll } from '../lib/decorators'

describe('Container', () => {
  it('should be defined.', () => {
    expect(Container).toBeDefined()
  })
})

describe('@Injectable() decorator', () => {
  @Injectable()
  class Foo {}

  it('should resolve Foo to itself.', () => {
    expect(Container.resolve(Foo)).toBeInstanceOf(Foo)
  })

  @Injectable({ token: 'Bar' })
  class Bar {}

  it('should throw on an unbound token.', () => {
    expect(() => Container.resolve(Bar)).toThrow()
  })

  it('should resolve a string token.', () => {
    expect(Container.resolve<Bar>('Bar')).toBeInstanceOf(Bar)
  })

  @Injectable({ useFactory: () => new Foo() })
  class FooFactory {}

  it('should resolve a factory token.', () => {
    expect(Container.resolve(FooFactory)).toBeInstanceOf(Foo)
  })

  @Injectable({ useToken: 'Bar' })
  class BarAlias {}

  it('should resolve an aliased token.', () => {
    expect(Container.resolve(BarAlias)).toBeInstanceOf(Bar)
  })

  @Injectable({ useValue: new Bar() })
  class BarSingleton {}

  it('should resolve a value token to the same registered value.', () => {
    expect(Container.resolve(BarSingleton)).toBeInstanceOf(Bar)

    const bar1 = Container.resolve(BarSingleton)
    const bar2 = Container.resolve(BarSingleton)

    expect(bar1).toEqual(bar2)
  })

  interface IBaz {
    baz(): string
  }

  @Injectable({ token: 'IBaz' })
  class Baz1 implements IBaz {
    public baz(): string {
      return 'baz1'
    }
  }

  @Injectable({ token: 'IBaz' })
  class Baz2 implements IBaz {
    public baz(): string {
      return 'baz2'
    }
  }

  it('should resolve multiple assignments to the last one.', () => {
    expect(Container.resolve<IBaz>('IBaz').baz()).toEqual('baz2')
  })

  it('should resolve all the assignments to an array.', () => {
    const bazArray = Container.resolveAll<IBaz>('IBaz')

    expect(bazArray).toHaveLength(2)

    expect(bazArray[0].baz()).toEqual('baz1')
    expect(bazArray[1].baz()).toEqual('baz2')
  })

  @Injectable({ autoInject: false })
  class Baz {}

  it('should throw on an unresolved `not auto-injected` injectable.', () => {
    expect(() => Container.resolve(Baz)).toThrow()
  })

  @Injectable()
  class Service {
    public constructor(public readonly foo: Foo) {}
  }

  it('should inject dependencies into the constructor.', () => {
    expect(Container.resolve(Service).foo).toBeInstanceOf(Foo)
  })
})

describe('@Inject() decorator', () => {
  @Injectable()
  class Repository {
    public findOne(): string {
      return 'Finding one instance from the repository...'
    }
  }

  @Injectable()
  class UserService {
    public constructor(@Inject(Repository) public readonly repository) {}
  }

  it('should inject a `Repository` instance into `UserService`.', () => {
    expect(Container.resolve(UserService).repository).toBeInstanceOf(Repository)
  })

  const issuer = 'http://localhost:3333'

  Container.bindToken<string>('issuer').toValue(issuer)

  @Injectable()
  class AuthService {
    public constructor(@Inject('issuer') public readonly issuer: string) {}
  }

  it('should inject an `issuer` string into `AuthService`.', () => {
    expect(Container.resolve(AuthService).issuer).toEqual(issuer)
  })
})

describe('@InjectAll() decorator', () => {
  interface IRunner {
    run(): string
  }

  @Injectable({ token: 'IRunner' })
  class StandardRunner implements IRunner {
    public run(): string {
      return 'Standard Runner'
    }
  }

  @Injectable({ token: 'IRunner' })
  class SecondaryRunner implements IRunner {
    public run(): string {
      return 'Secondary Runner'
    }
  }

  @Injectable()
  class Controller {
    public constructor(
      @InjectAll('IRunner') public readonly runners: IRunner[]
    ) {}
  }

  it('should inject all instances of IRunner.', () => {
    const controller = Container.resolve(Controller)

    expect(Array.isArray(controller.runners)).toBeTruthy()

    expect(controller.runners[0]).toBeInstanceOf(StandardRunner)
    expect(controller.runners[1]).toBeInstanceOf(SecondaryRunner)

    expect(controller.runners[0].run()).toEqual('Standard Runner')
    expect(controller.runners[1].run()).toEqual('Secondary Runner')
  })
})
