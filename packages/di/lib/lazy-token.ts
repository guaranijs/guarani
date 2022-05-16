import { Constructor } from '@guarani/types';

/**
 * Wrapper class used to delay the resolution of a **Constructor** Injectable Token.
 *
 * This class is mainly used when there is the possibility of circular dependency between two classes.
 *
 * In order to avoid a Runtime Error due to a circular dependency, this class returns a Proxy that acts in lieu
 * of the original delayed Injectable Token.
 */
export class LazyToken<T> {
  /**
   * Reflect's Methods used to create the Proxy Handler.
   */
  private static readonly reflectMethods: (keyof ProxyHandler<any>)[] = [
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
    'setPrototypeOf',
  ];

  /**
   * Wraps a Constructor Injectable Token to delay its resolution.
   *
   * @param wrappedToken Wrapped Injectable Token.
   */
  public constructor(private readonly wrappedToken: () => Constructor<T>) {}

  /**
   * Resolves the wrapped Injectable Token.
   *
   * @param callback Callback function used to resolve the Injectable Token.
   * @returns Proxy that acts in lieu of the wrapped Injectable Token.
   */
  public resolve(callback: (lazyToken: Constructor<T>) => T): T {
    const callbackResolver: () => T = () => {
      return callback(this.wrappedToken());
    };

    return new Proxy<any>({}, this.createHandler(callbackResolver));
  }

  /**
   * Creates a Proxy Handler for the wrapped Injectable Token's Proxy object.
   *
   * @param callbackResolver Callback containing the Injectable Token resolver.
   * @returns Proxy Handler of the wrapped Injectable Token.
   */
  private createHandler(callbackResolver: () => T): ProxyHandler<object> {
    const handler: ProxyHandler<object> = {};

    for (const method of LazyToken.reflectMethods) {
      const handlerMethod = (...args: any[]): any => (<any>Reflect[method])(callbackResolver(), ...args.slice(1));
      handler[method] = handlerMethod;
    }

    return handler;
  }
}
