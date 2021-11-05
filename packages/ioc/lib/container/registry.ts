import { Binding } from '../bindings'
import { TokenNotRegistered } from '../exceptions'
import { InjectableToken } from '../tokens'

/**
 * Registry that holds the mappings between the Tokens and their Bindings.
 */
export class Registry {
  /**
   * Mapping between the Tokens and their Bindings.
   */
  private readonly bindings = new Map<InjectableToken<any>, Binding<any>[]>()

  /**
   * Adds an entry to the mapping of the requested token.
   *
   * @param token Injectable Token to be extended.
   * @param binding Binding to be set at the requested token.
   */
  public add<T>(token: InjectableToken<T>, binding: Binding<T>): void {
    if (!this.has(token)) {
      this.set(token, [])
    }

    this.bindings.get(token)!.push(binding)
  }

  /**
   * Returns the last Binding entry of the requested token.
   *
   * @param token Injectable Token used to retrieve a binding.
   * @returns Last registered binding of the token.
   */
  public get<T>(token: InjectableToken<T>): Binding<T> {
    if (!this.has(token)) {
      throw new TokenNotRegistered(token)
    }

    const bindings = this.bindings.get(token)!

    return bindings[bindings.length - 1]
  }

  /**
   * Returns all the Bindings of the requested token.
   *
   * @param token Injectable Token used to retrieve the bindings.
   * @returns Registered bindings of the token.
   */
  public getAll<T>(token: InjectableToken<T>): Binding<T>[] {
    if (!this.has(token)) {
      throw new TokenNotRegistered(token)
    }

    return this.bindings.get(token)!
  }

  /**
   * Determines whether or not the requested token is already registered.
   *
   * @param token Injectable Token to be inspected.
   * @returns Whether or not the token is registered.
   */
  public has<T>(token: InjectableToken<T>): boolean {
    return this.bindings.has(token)
  }

  /**
   * Deletes an Injectable Token from the Registry.
   *
   * @param token Injectable Token to be deleted.
   */
  public delete<T>(token: InjectableToken<T>): void {
    this.bindings.delete(token)
  }

  /**
   * Clears all the Tokens and their respective Bindings from the mapping.
   */
  public clear(): void {
    this.bindings.clear()
  }

  private set<T>(token: InjectableToken<T>, value: Binding<T>[]): void {
    this.bindings.set(token, value)
  }
}
