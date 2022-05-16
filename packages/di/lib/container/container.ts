import { Constructor, Optional } from '@guarani/types';

import { Binding } from '../bindings/binding';
import { ProviderBinding } from '../bindings/provider.binding';
import { InvalidProviderException } from '../exceptions/invalid-provider.exception';
import { ResolutionException } from '../exceptions/resolution.exception';
import { InjectableToken } from '../injectable-token';
import { LazyToken } from '../lazy-token';
import { Lifecycle } from '../lifecycle';
import { isClassProvider } from '../providers/class.provider';
import { isFactoryProvider } from '../providers/factory.provider';
import { isProvider, Provider } from '../providers/provider';
import { isTokenProvider } from '../providers/token.provider';
import { isValueProvider } from '../providers/value.provider';
import { TokenDescriptor } from '../types/token-descriptor';
import { Registry } from './registry';

/**
 * Implementation of the Dependency Injection Container.
 */
export class DIContainer {
  /**
   * Registry containing the mapping of the Tokens to their respective Bindings.
   */
  private readonly registry = new Registry();

  /**
   * Creates an entry for a dependency at the Container, indexed by the provided Token.
   *
   * @param token Token used to identify the dependency.
   * @returns Binding Provider's Fluent Syntax.
   */
  public bind<T>(token: InjectableToken<T>): ProviderBinding<T> {
    const binding = new Binding<T>(token);
    this.registry.set(token, binding);
    return new ProviderBinding<T>(binding);
  }

  /**
   * Checks if the requested Token is registered as a dependency at the Container.
   *
   * @param token Token to be checked.
   */
  public isRegistered<T>(token: InjectableToken<T>): boolean {
    return this.registry.has(token);
  }

  /**
   * Resolves the requested Token.
   *
   * The Token **MUST** be known by the Container.
   *
   * @param token Token to be resolved.
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @returns Resolved instance or value based on the Token.
   */
  public resolve<T>(token: InjectableToken<T>): T {
    return this._resolve<T>(token);
  }

  /**
   * Resolves all the instances of the requested Token.
   *
   * The Token **MUST** be known by the Container.
   *
   * @param token Token to be resolved.
   * @returns Array of the resolved instances based on the Token.
   */
  public resolveAll<T>(token: InjectableToken<T>): T[] {
    return this._resolveAll<T>(token);
  }

  /**
   * Deletes a Token from the Container.
   *
   * @param token Token to be deleted.
   */
  public delete<T>(token: InjectableToken<T>): void {
    this.registry.delete(token);
  }

  /**
   * Removes all the Tokens from the Container.
   */
  public clear(): void {
    this.registry.clear();
  }

  /**
   * Helper function used to resolve the requested Token and provide support for the Request Lifecycle,
   * while also keeping it transparent to the public api.
   *
   * @param token Token to be resolved.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @returns Resolved instance or valued based on the Token.
   */
  private _resolve<T>(token: InjectableToken<T>, requestResolutions = new Map<InjectableToken<any>, any>()): T {
    if (token instanceof LazyToken) {
      return token.resolve((lazyToken) => this._resolve<T>(lazyToken, requestResolutions));
    }

    const binding = this.registry.get<T>(token);
    return this.resolveBinding<T>(binding, requestResolutions);
  }

  /**
   * Helper function used to resolve all of the bindings of the requested Token and provide support
   * for the Request Lifecycle, while also keeping it transparent to the public api.
   *
   * @param token Token to be resolved.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @returns Array of the resolved instances based on the Token.
   */
  private _resolveAll<T>(token: InjectableToken<T>, requestResolutions = new Map<InjectableToken<any>, any>()): T[] {
    if (token instanceof LazyToken) {
      throw new ResolutionException('The resolution of multiple Lazy Tokens is unsupported.');
    }

    const bindings = this.registry.getAll<T>(token);
    return bindings.map((binding) => this.resolveBinding<T>(binding, requestResolutions));
  }

  /**
   * Resolves the requested Binding based on its Lifecycle.
   *
   * @param binding Binding to be resolved.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @returns Resolved instance.
   */
  private resolveBinding<T>(binding: Binding<T>, requestResolutions: Map<InjectableToken<any>, any>): T {
    switch (binding.lifecycle) {
      case Lifecycle.Singleton: {
        return (binding.singleton ??= this.resolveProvider(binding.provider, requestResolutions));
      }

      case Lifecycle.Request: {
        let instance = requestResolutions.get(binding.token);

        if (instance === undefined) {
          instance = this.resolveProvider(binding.provider, requestResolutions);
          requestResolutions.set(binding.token, instance);
        }

        return instance;
      }

      case Lifecycle.Transient:
        return this.resolveProvider(binding.provider, requestResolutions);

      default:
        // The only reason I put this is so that the compiler does not complain about the return type.
        throw new TypeError(`Invalid Lifecycle "${binding.lifecycle}".`);
    }
  }

  /**
   * Resolves the requested Provider based on its type.
   *
   * @param provider Provider to be resolved.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @returns Resolved instance.
   */
  private resolveProvider<T>(provider: Provider<T>, requestResolutions: Map<InjectableToken<any>, any>): T {
    if (!isProvider(provider)) {
      throw new InvalidProviderException(provider);
    }

    if (isClassProvider<T>(provider)) {
      return this.construct(provider.useClass, requestResolutions);
    }

    if (isFactoryProvider<T>(provider)) {
      return provider.useFactory(this);
    }

    if (isTokenProvider<T>(provider)) {
      return this._resolve(provider.useToken, requestResolutions);
    }

    if (isValueProvider<T>(provider)) {
      return provider.useValue;
    }

    // The only reason I put this is so that the compiler does not complain about the return type.
    throw new InvalidProviderException(provider);
  }

  /**
   * Creates a new instance of the requested Constructor with all its dependencies resolved.
   *
   * @param constructor Constructor to be instantiated.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @returns Resolved instance.
   */
  private construct<T>(constructor: Constructor<T>, requestResolutions: Map<InjectableToken<any>, any>): T {
    const paramTypeDescriptors: TokenDescriptor<any>[] = Reflect.getMetadata('guarani:paramtypes', constructor) ?? [];

    const resolvedParamDependencies = paramTypeDescriptors.map((descriptor) => {
      const { multiple, optional, token } = descriptor;

      if (!this.registry.has(token) && optional) {
        return undefined;
      }

      return multiple ? this._resolveAll(token, requestResolutions) : this._resolve(token, requestResolutions);
    });

    const instance = <T>Reflect.construct(constructor, resolvedParamDependencies);

    const staticPropTokens: Map<string | symbol, TokenDescriptor<any>> = Reflect.getMetadata(
      'guarani:proptokens',
      constructor
    );

    if (staticPropTokens !== undefined) {
      for (const [property, descriptor] of staticPropTokens) {
        const { multiple, optional, token } = descriptor;

        if (this.registry.has(token) || !optional) {
          // @ts-expect-error Constructor does not exist on type T.
          instance.constructor[property] = multiple
            ? this._resolveAll(token, requestResolutions)
            : this._resolve(token, requestResolutions);
        }
      }
    }

    const instancePropTokens: Map<string | symbol, TokenDescriptor<any>> = Reflect.getMetadata(
      'guarani:proptokens',
      constructor.prototype
    );

    if (instancePropTokens !== undefined) {
      for (const [property, descriptor] of instancePropTokens) {
        const { multiple, optional, token } = descriptor;

        if (this.registry.has(token) || !optional) {
          // @ts-expect-error Cannot index type unknown.
          instance[property] = multiple
            ? this._resolveAll(token, requestResolutions)
            : this._resolve(token, requestResolutions);
        }
      }
    }

    return instance;
  }
}

/**
 * Implementation of the Dependency Injection Container.
 *
 * This is achieved by registering the classes and values to be injected as bindings to Tokens into the Container.
 * The Token can be represented as the own definition of a class, as a string or as a symbol.
 *
 * ```
 *   import { Container, Injectable } from "@guarani/di";
 *
 *   // Example of binding the token "Foo" to the class "Foo".
 *  ⠀@Injectable()
 *   class Foo {}
 *   Container.bind(Foo).toSelf();
 *
 *   // Example of binding the token "Bar" to the class "Bar".
 *  ⠀@Injectable()
 *   class Bar {}
 *   Container.bind<Bar>("Bar").toClass(Bar);
 *
 *   // Example of binding the token "Issuer" to the value "https://example.com".
 *   Container.bind<string>("Issuer").toValue("https://example.com");
 * ```
 *
 * To inject a dependency into a class, simple decorate it as an `@Injectable()` and define the parameters
 * to be received at the class' constructor.
 *
 * Note that the dependencies **MUST** also be registered at the Container, first by being declared as `@Injectable()`,
 * and then registering it at the Container via the method `Container.bind()`.
 *
 * ```
 *   import { Container, Injectable } from "@guarani/di";
 *
 *  ⠀@Injectable()
 *   class Foo {}
 *   Container.bind(Foo).toSelf();
 *
 *  ⠀@Injectable()
 *   class Bar {
 *     public constructor(private readonly foo: Foo) {}
 *   }
 *   Container.bind(Bar).toSelf();
 * ```
 *
 * To inject values that cannot be registered as an `@Injectable()`, such as strings or interfaces,
 * you must use `@Inject()` and `@InjectAll()`.
 *
 * The `@Inject()` decorator injects the last provider registered at the Container, while the `@InjectAll()` decorator
 * injects all the providers registered at the Container.
 *
 * ```
 *   import { Container, Inject, InjectAll, Injectable } from "@guarani/di";
 *
 *   interface Foo {
 *     echo(): string;
 *   }
 *
 *  ⠀@Injectable()
 *   class Bar implements Foo {
 *     public echo(): string {
 *       return "foo";
 *     }
 *   }
 *   Container.bind<Foo>("Foo").toClass(Bar);
 *
 *  ⠀@Injectable()
 *   class Baz implements Foo {
 *     public echo(): string {
 *       return "bar";
 *     }
 *   }
 *   Container.bind<Foo>("Foo").toClass(Baz);
 *
 *  ⠀@Injectable()
 *   class Qux {}
 *   Container.bind(Qux).toSelf();
 *
 *   Container.bind<string>("Issuer").toValue("https://example.com");
 *
 *  ⠀@Injectable()
 *   class Service {
 *     public constructor(
 *       private readonly qux: Qux,
 *      ⠀@Inject("Issuer") private readonly issuer: string,
 *      ⠀@InjectAll("Foo") private readonly fooArray: Foo[],
 *     ) {}
 *   }
 *   Container.bind(Service).toSelf();
 * ```
 *
 * To resolve a single `@Injectable()` or a single value, use the method `Container.resolve()`.
 * This resolves all the dependencies and returns an instance of the requested class or the value bound to the Token.
 *
 * To resolve all the registered `@Injectable()` or values of the Token, use the method `Container.resolveAll()`.
 * This will traverse all the providers bound to the requested Token and return an array
 * containing the resolved instances or values, ordered by the insertion precedence.
 */
export const Container = new DIContainer();

/**
 * Registry of the Containers requested through **getContainer()**.
 */
const containers = new Map<string | symbol, DIContainer>([['default', Container]]);

/**
 * Returns an instance of a Dependency Injection Container based on the requested name.
 *
 * If the container was previously requested, it will not instantiate a new Container in its place.
 *
 * @param name Name of the Container.
 * @returns Instance of the requested Container.
 */
export function getContainer(name: Optional<string | symbol> = 'default'): DIContainer {
  if (!containers.has(name)) {
    containers.set(name, new DIContainer());
  }

  return containers.get(name)!;
}
