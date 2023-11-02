import { AbstractConstructor, Constructor } from '@guarani/types';

import { Binding } from '../bindings/binding';
import { ProviderBinding } from '../bindings/provider.binding';
import { InvalidProviderException } from '../exceptions/invalid-provider.exception';
import { ResolutionException } from '../exceptions/resolution.exception';
import { PARAM_TYPES, PROP_TOKENS } from '../metadata/metadata.keys';
import { isClassProvider } from '../providers/class.provider';
import { isFactoryProvider } from '../providers/factory.provider';
import { isProvider, Provider } from '../providers/provider';
import { isTokenProvider } from '../providers/token.provider';
import { isValueProvider } from '../providers/value.provider';
import { InjectableToken } from '../types/injectable-token.type';
import { LazyToken } from '../types/lazy-token';
import { Lifecycle } from '../types/lifecycle.enum';
import { TokenDescriptor } from '../types/token.descriptor';
import { DependencyInjectionRegistry } from './dependency-injection.registry';

/**
 * Implementation of the Dependency Injection Container.
 */
export class DependencyInjectionContainer {
  /**
   * Registry containing the mapping of the Tokens to their respective Bindings.
   */
  private readonly registry = new DependencyInjectionRegistry();

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
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
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
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
   * @throws {ResolutionException} Could not resolve a token.
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
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
   * @returns Resolved instance or valued based on the Token.
   */
  private _resolve<T>(token: InjectableToken<T>, requestResolutions = new Map<InjectableToken<T>, T>()): T {
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
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
   * @throws {ResolutionException} Could not resolve a token.
   * @returns Array of the resolved instances based on the Token.
   */
  private _resolveAll<T>(token: InjectableToken<T>, requestResolutions = new Map<InjectableToken<T>, T>()): T[] {
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
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
   * @returns Resolved instance.
   */
  private resolveBinding<T>(binding: Binding<T>, requestResolutions: Map<InjectableToken<T>, T>): T {
    switch (binding.lifecycle) {
      case Lifecycle.Singleton: {
        return (binding.singleton ??= this.resolveProvider(binding.provider, requestResolutions));
      }

      case Lifecycle.Request: {
        let instance = requestResolutions.get(binding.token);

        if (typeof instance === 'undefined') {
          instance = this.resolveProvider(binding.provider, requestResolutions);
          requestResolutions.set(binding.token, instance);
        }

        return instance;
      }

      case Lifecycle.Transient:
        return this.resolveProvider(binding.provider, requestResolutions);
    }
  }

  /**
   * Resolves the requested Provider based on its type.
   *
   * @param provider Provider to be resolved.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
   * @returns Resolved instance.
   */
  private resolveProvider<T>(provider: Provider<T>, requestResolutions: Map<InjectableToken<T>, T>): T {
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
   * @param class_ Constructor to be instantiated.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
   * @returns Resolved instance.
   */
  private construct<T>(
    class_: AbstractConstructor<T> | Constructor<T>,
    requestResolutions: Map<InjectableToken<T>, T>
  ): T {
    const resolvedParamDependencies = this.resolveConstructorDependencies(class_, requestResolutions);

    const instance = Reflect.construct(class_, resolvedParamDependencies);

    this.resolvePropertiesDependencies(class_, requestResolutions);
    this.resolvePropertiesDependencies(instance, requestResolutions);

    return instance as T;
  }

  /**
   * Resolves the dependencies of the constructor of the provided class.
   *
   * @param class_ Constructor to be instantiated.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
   * @returns Resolved constructor parameters of the provided class.
   */
  private resolveConstructorDependencies<T>(
    class_: AbstractConstructor<T> | Constructor<T>,
    requestResolutions: Map<InjectableToken<T>, T>
  ): unknown[] {
    const paramTypeDescriptors: TokenDescriptor<unknown>[] = Reflect.getMetadata(PARAM_TYPES, class_) ?? [];

    return paramTypeDescriptors.map((descriptor) => {
      const { multiple, optional, token } = descriptor;

      if (!this.registry.has(token) && optional) {
        return undefined;
      }

      return multiple ? this._resolveAll(token, requestResolutions) : this._resolve(token, requestResolutions);
    });
  }

  /**
   * Resolves the dependencies of the properties of the provided class or instance.
   *
   * @param classOrInstance Constructor or instance to be resolved.
   * @param requestResolutions Mapping of the Request-scoped resolved instances.
   * @throws {TokenNotRegisteredException} The Token is not registered at the Container.
   * @throws {InvalidProviderException} Attempted to resolve an invalid provider.
   * @returns Resolved properties of the provided class or instance.
   */
  private resolvePropertiesDependencies<T>(
    classOrInstance: object | AbstractConstructor<T> | Constructor<T>,
    requestResolutions: Map<InjectableToken<T>, T>
  ): void {
    const propTokens: Map<string | symbol, TokenDescriptor<unknown>> | undefined = Reflect.getMetadata(
      PROP_TOKENS,
      classOrInstance
    );

    if (propTokens instanceof Map) {
      propTokens.forEach((descriptor, property) => {
        const { multiple, optional, token } = descriptor;

        let value: unknown;

        if (this.registry.has(token) || !optional) {
          value = multiple ? this._resolveAll(token, requestResolutions) : this._resolve(token, requestResolutions);
        }

        Reflect.set(classOrInstance, property, value);
      });
    }
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
 * and then registering it at the Container via the method `Container.bind()`, unless the parameter/property
 * is decorated with the `@Optional()` decorator.
 *
 * ```
 *   import { Container, Injectable, Optional } from "@guarani/di";
 *
 *  ⠀@Injectable()
 *   class Foo {}
 *   Container.bind(Foo).toSelf();
 *
 *  ⠀@Injectable()
 *   class Bar {
 *     public constructor(private readonly foo: Foo, @Optional() @Inject("Issuer") private readonly issuer?: string) {}
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
 *   interface IFoo {
 *     echo(): string;
 *   }
 *
 *  ⠀@Injectable()
 *   class Foo1 implements IFoo {
 *     public echo(): string {
 *       return "foo1";
 *     }
 *   }
 *   Container.bind<IFoo>("IFoo").toClass(Foo1);
 *
 *  ⠀@Injectable()
 *   class Foo2 implements IFoo {
 *     public echo(): string {
 *       return "foo2";
 *     }
 *   }
 *   Container.bind<IFoo>("IFoo").toClass(Foo2);
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
 *      ⠀@InjectAll("IFoo") private readonly fooArray: IFoo[],
 *     ) {}
 *   }
 *   Container.bind(Service).toSelf();
 * ```
 *
 * To resolve a single `@Injectable()` or a single value, use the method `Container.resolve()`.
 * This resolves all the dependencies and returns an instance of the requested class or the value bound to the Token.
 *
 * ```
 *   import { Container } from "@guarani/di";
 *
 *  ⠀@Injectable()
 *   class Foo {}
 *   Container.bind(Foo).toSelf();
 *
 *   const foo = Container.resolve(Foo); // <Foo {}>
 * ```
 *
 * To resolve all the registered `@Injectable()` or values of the Token, use the method `Container.resolveAll()`.
 * This will traverse all the providers bound to the requested Token and return an array
 * containing the resolved instances or values, ordered by the insertion precedence.
 *
 * ```
 *   import { Container, Inject, InjectAll, Injectable } from "@guarani/di";
 *
 *   interface IFoo {
 *     echo(): string;
 *   }
 *
 *  ⠀@Injectable()
 *   class Foo1 implements IFoo {
 *     public echo(): string {
 *       return "foo1";
 *     }
 *   }
 *   Container.bind<IFoo>("IFoo").toClass(Foo1);
 *
 *  ⠀@Injectable()
 *   class Foo2 implements IFoo {
 *     public echo(): string {
 *       return "foo2";
 *     }
 *   }
 *   Container.bind<IFoo>("IFoo").toClass(Foo2);
 *
 *   const fooArray = Container.resolveAll<IFoo>("IFoo"); // <[Foo1 {}, Foo2 {}]>
 * ```
 */
export const Container = new DependencyInjectionContainer();

/**
 * Registry of the Containers requested through **getContainer()**.
 */
const containers = new Map<string | symbol, DependencyInjectionContainer>([['default', Container]]);

/**
 * Returns an instance of a Dependency Injection Container based on the requested name.
 *
 * If the container was previously requested, it will not instantiate a new Container in its place.
 *
 * @param name Name of the Container.
 * @returns Instance of the requested Container.
 */
export function getContainer(name: string | symbol = 'default'): DependencyInjectionContainer {
  if (!containers.has(name)) {
    containers.set(name, new DependencyInjectionContainer());
  }

  return containers.get(name)!;
}
