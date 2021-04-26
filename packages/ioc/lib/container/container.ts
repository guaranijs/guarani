import { Binding, ProviderBinding } from '../bindings'
import { TokenNotRegistered } from '../exceptions'
import { getParamTypes, getPropTokens } from '../metadata'
import {
  isClassProvider,
  isFactoryProvider,
  isProvider,
  isTokenProvider,
  isValueProvider,
  Provider
} from '../providers'
import { InjectableToken } from '../tokens'
import { Constructor } from '../types'
import { Registry } from './registry'

/**
 * Implementation of the internal IoC Container.
 */
export class IoCContainer {
  /**
   * Registry containing the mapping of the Tokens to its bindings,
   * where each binding contains a provider specifying the resolution
   * method to be used when resolving the Token.
   */
  private readonly registry = new Registry()

  /**
   * Adds an entry to the registry using the provided binding or,
   * if the entry already exists, extends it by adding another binding.
   *
   * The `ProviderBinding` object returned is used to set the provider
   * that defines the resolution method used when resolving the Token.
   *
   * @param token - Injectable Token to be used as the binding key.
   * @returns Binding Provider configuration object.
   */
  public bindToken<T>(token: InjectableToken<T>): ProviderBinding<T> {
    const binding = new Binding<T>(token)
    this.registry.add(token, binding)
    return new ProviderBinding(binding)
  }

  /**
   * Resolves the requested Token. The token **MUST** be known by the Container.
   *
   * @param token - Injectable Token to be resolved.
   * @throws {TokenNotRegistered} The token is not registered at the Container.
   * @returns Resolved instance or value based on the Token.
   */
  public resolve<T>(token: InjectableToken<T>): T {
    if (!this.isBound(token)) throw new TokenNotRegistered(token)
    const { provider } = this.registry.get(token)
    return this.resolveProvider(provider)
  }

  /**
   * Resolves all the entries bound to the requested Token
   * and returns an array with these resolved entries.
   *
   * The token **MUST** be known by the Container.
   *
   * @param token - Injectable Token to be resolved.
   * @returns Ordered array of the resolved providers bound to the Token.
   */
  public resolveAll<T>(token: InjectableToken<T>): T[] {
    if (!this.isBound(token)) throw new TokenNotRegistered(token)
    const bindings = this.registry.getAll(token)
    return bindings.map(binding => this.resolveProvider(binding.provider))
  }

  /**
   * Clears the registry, removing all the bindings from it.
   */
  public clear(): void {
    this.registry.clear()
  }

  /**
   * Resolves the requested Provider based on its type.
   *
   * @param provider - Provider to be resolved.
   * @returns Resolved provider.
   */
  private resolveProvider<T>(provider: Provider<T>): T {
    if (!isProvider<T>(provider))
      throw new TypeError(`The object ${provider} is not a provider.`)

    if (isClassProvider<T>(provider)) return this.construct(provider.target)
    if (isFactoryProvider<T>(provider)) return provider.factory()
    if (isTokenProvider<T>(provider)) return this.resolve(provider.token)
    if (isValueProvider<T>(provider)) return provider.value
  }

  /**
   * Creates a new instance of the requested Constructor with all its
   * dependencies resolved and injected at the correct place, as well
   * as all the resolved property injections.
   *
   * @param constructor - Constructor to be instantiated.
   * @returns Instantiated Constructor.
   */
  private construct<T>(constructor: Constructor<T>): T {
    const tokens = getParamTypes(constructor) ?? []

    const resolvedTokens = tokens.map(token =>
      token.multiple ? this.resolveAll(token.token) : this.resolve(token.token)
    )

    const instance = Reflect.construct(constructor, resolvedTokens)
    const propTokens = getPropTokens(constructor)

    if (propTokens)
      Object.entries(propTokens).forEach(([prop, token]) => {
        instance[prop] = token.multiple
          ? this.resolveAll(token.token)
          : this.resolve(token.token)
      })

    return instance
  }

  /**
   * Returns whether or not the requested token is registered at the Container.
   *
   * @param token - Injectable Token to be inspected.
   * @returns Whether or not the Token is registered.
   */
  private isBound<T>(token: InjectableToken<T>): boolean {
    return this.registry.has(token)
  }
}

/**
 * Implementation of the Inversion of Control Container.
 *
 * This Container is the entry point for the Dependency Injection
 * implementation of Inversion of Control.
 *
 * This is achieved by registering the classes and values to be injected as
 * bindings to Tokens into the Container. The Token can be represented as the
 * own definition of a class, as a string or as a symbol.
 *
 * ```
 *   import { Container, Injectable } from "@guarani/ioc"
 *
 *   // Example of binding the token `Foo` to the class `Foo`.
 *  ⠀@Injectable()
 *   class Foo {}
 *
 *   // Example of binding the token "Bar" to the class `Bar`.
 *  ⠀@Injectable({ token: "Bar" })
 *   class Bar {}
 *
 *   // Example of binding the token "issuer" to the value "http://example.com".
 *   Container.bindToken<string>("issuer").toValue<string>("http://example.com")
 * ```
 *
 * Every class decorated with the `@Injectable()` decorator is automatically
 * registered at the Container. This decorator can receive options to customize
 * the binding of the class at the Container. Please refer to its documentation
 * for more information.
 *
 * To inject a dependency into a class, simple decorate it as an `@Injectable()`
 * and define the parameters to be received at the class' constructor.
 *
 * Note that the dependencies **MUST** also be registered at the Container,
 * either by declaring it as an `@Injectable()`, or by manually registering it
 * at the Container via the `Container.bindToken()` method.
 *
 * ```
 *   import { Container, Injectable } from "@guarani/ioc"
 *
 *  ⠀@Injectable()
 *   class Foo {}
 *
 *  ⠀@Injectable()
 *   class Bar {
 *     public constructor(private readonly foo: Foo) {}
 *   }
 * ```
 *
 * To inject values that cannot be registered as an `@Injectable()`,
 * such as strings or interfaces, you must use `@Inject()` and `@InjectAll()`.
 *
 * The `@Inject()` decorator injects the last provider registered at the
 * Container, while the `@InjectAll()` decorator injects all the providers
 * registered at the Container.
 *
 * ```
 *   import { Container, Inject, InjectAll, Injectable } from "@guarani/ioc"
 *
 *   interface Foo {
 *     echo(): string
 *   }
 *
 *  ⠀@Injectable({ token: "Foo" })
 *   class Bar implements Foo {
 *     public echo(): string {
 *       return "foo"
 *     }
 *   }
 *
 *  ⠀@Injectable({ token: "Foo" })
 *   class Baz implements Foo {
 *     public echo(): string {
 *       return "bar"
 *     }
 *   }
 *
 *  ⠀@Injectable()
 *   class Qux {}
 *
 *   Container.bindToken<string>("issuer").toValue<string>("http://example.com")
 *
 *  ⠀@Injectable()
 *   class Service {
 *     public constructor(
 *       private readonly qux: Qux,
 *      ⠀@Inject("issuer") private readonly issuer: string,
 *      ⠀@InjectAll("Foo") private readonly fooArray: Foo[]
 *     ) {}
 *   }
 * ```
 *
 * To resolve a single `@Injectable()` or a single value, use the method
 * `Container.resolve()`. This resolves all the dependencies and returns
 * an instance of the requested class or the value bound to the Token.
 *
 * To resolve all the registered `@Injectable()` or values of the Token,
 * use the method `Container.resolveAll()`. This will traverse all the
 * providers bound to the requested Token and return an array containing
 * the resolved instances or values, ordered by the insertion precedence.
 */
export const Container = new IoCContainer()
