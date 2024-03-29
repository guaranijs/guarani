import { InjectableToken } from './injectable-token.type';

/**
 * Reflect's Methods used to create a Proxy Handler.
 */
const reflectMethods: (keyof ProxyHandler<object>)[] = [
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
 * Wrapper class used to delay the resolution of a **Constructor** Injectable Token.
 *
 * This class is used when there is the possibility of circular dependency between two classes.
 *
 * In order to avoid a Runtime Error due to a circular dependency, this class returns a Proxy
 * that acts in lieu of the original Injectable Token.
 */
export class LazyToken<T> {
  /**
   * Wraps a Constructor Injectable Token to delay its resolution.
   *
   * @param wrappedToken Wrapped Injectable Token.
   */
  public constructor(private readonly wrappedToken: () => InjectableToken<T>) {}

  /**
   * Resolves the wrapped Injectable Token.
   *
   * @param callback Callback function used to resolve the Injectable Token.
   * @returns Proxy that acts in lieu of the wrapped Injectable Token.
   */
  public resolve(callback: (lazyToken: InjectableToken<T>) => T): T {
    const callbackResolver = () => {
      return callback(this.wrappedToken());
    };

    return new Proxy({}, this.createHandler(callbackResolver)) as T;
  }

  /**
   * Resolves all the instances of the wrapped Injectable Token.
   *
   * @param callback Callback function used to resolve the Injectable Token.
   * @returns Proxies that act in lieu of the wrapped Injectable Token instances.
   */
  public resolveAll(callback: (lazyToken: InjectableToken<T>) => T[]): T[] {
    const multipleCallbackResolver = () => {
      return callback(this.wrappedToken());
    };

    const handlers = this.createHandlers(multipleCallbackResolver);

    return handlers.map((handler) => new Proxy({}, handler) as T);
  }

  /**
   * Creates a Proxy Handler for the wrapped Injectable Token's Proxy object.
   *
   * @param callbackResolver Callback containing the Injectable Token resolver.
   * @returns Proxy Handler of the wrapped Injectable Token.
   */
  private createHandler(callbackResolver: () => T): ProxyHandler<object> {
    const handler: ProxyHandler<object> = {};

    reflectMethods.forEach((method) => {
      handler[method] = (...args: unknown[]) => {
        return (<CallableFunction>Reflect[method])(callbackResolver(), ...args.slice(1));
      };
    });

    return handler;
  }

  /**
   * Creates a Proxy Handler for the wrapped Injectable Token's Proxy object.
   *
   * @param multipleCallbackResolver Callback containing the Injectable Token resolver.
   * @returns Proxy Handlers of the wrapped Injectable Token.
   */
  private createHandlers(multipleCallbackResolver: () => T[]): ProxyHandler<object>[] {
    const callbackResolvers = multipleCallbackResolver();

    return callbackResolvers.map((resolvedCallback) => {
      const handler: ProxyHandler<object> = {};

      reflectMethods.forEach((method) => {
        handler[method] = (...args: unknown[]) => {
          return (<CallableFunction>Reflect[method])(resolvedCallback, ...args.slice(1));
        };
      });

      return handler;
    });
  }
}
