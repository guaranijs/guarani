import { Constructor, Factory } from '@guarani/utils'

/**
 * Describes the acceptable formats for an Injectable token.
 */
export type InjectableToken<T> = Constructor<T> | LazyToken<T> | string | symbol

/**
 * Verifies if the provided token is a Constructor.
 *
 * @param token Token to be verified.
 * @returns Verification that the token is a Constructor.
 */
export function isConstructorToken<T>(
  token: InjectableToken<T>
): token is Constructor<T> {
  return typeof token === 'function' && !!token.prototype
}

/**
 * Verifies if the provided token is a string or symbol.
 *
 * @param token Token to be verified.
 * @returns Verification that the token is a valid string or symbol.
 */
export function isValueToken<T>(
  token: InjectableToken<T>
): token is string | symbol {
  return ['string', 'symbol'].includes(typeof token)
}

/**
 * Wrapper class used to delay the resolution of an **Injectable Token**.
 *
 * This class is mainly used when there is the possibility of
 * **Circular Dependency** between two classes.
 *
 * In order to avoid a Runtime Error due to a Circular Dependency,
 * this class returns a Proxy that acts in lieu of the original
 * delayed **Injectable Token**.
 *
 * The `Reflect` methods of the Proxy object is created based on
 * the resolved `wrappedToken`.
 */
export class LazyToken<T = any> {
  /**
   * Reflect's Methods used to create the Proxy Handler.
   */
  private readonly reflectMethods: (keyof ProxyHandler<any>)[] = [
    'apply',
    'construct',
    'defineProperty',
    'deleteProperty',
    'get',
    'getOwnPropertyDescriptor',
    'getPrototypeOf',
    'has',
    'isExtensible',
    'ownKeys',
    'preventExtensions',
    'set',
    'setPrototypeOf'
  ]

  /**
   * Wraps an Injectable Token into a Factory to delay its resolution.
   *
   * @param wrappedToken Injectable Token wrapped in a Factory.
   */
  public constructor(
    private readonly wrappedToken: Factory<InjectableToken<T>>
  ) {}

  /**
   * Resolves the wrapped Injectable Token and returns its Proxy.
   *
   * @param callback Callback function used to resolve the Injectable Token.
   * @returns Proxy that acts in lieu of the Wrapped Injectable Token.
   */
  public resolve(callback: (lazyToken: InjectableToken<T>) => T): T {
    const resolvedCallback: Factory<T> = () => {
      return callback(this.wrappedToken())
    }

    return new Proxy<any>({}, this.createHandler(resolvedCallback)) as T
  }

  /**
   * Creates a Proxy Handler for the Wrapped Injectable Token's Proxy object.
   *
   * @param resolvedCallback Callback containing the resolved Injectable Token.
   * @returns Proxy Handler of the Wrapped Injectable Token.
   */
  private createHandler(resolvedCallback: Factory<T>): ProxyHandler<object> {
    const handler: ProxyHandler<object> = {}

    for (const method of this.reflectMethods) {
      const handlerMethod = (...args: any[]): any => {
        return (Reflect[method] as any)(resolvedCallback(), ...args.slice(1))
      }

      handler[method] = handlerMethod
    }

    return handler
  }
}
