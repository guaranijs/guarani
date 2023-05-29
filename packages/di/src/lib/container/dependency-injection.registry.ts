import { Binding } from '../bindings/binding';
import { TokenNotRegisteredException } from '../exceptions/token-not-registered.exception';
import { InjectableToken } from '../types/injectable-token.type';

/**
 * Registry that holds the mapping between Tokens and their respective Bindings.
 */
export class DependencyInjectionRegistry {
  /**
   * Registry of the Bindings indexed by their respective Tokens.
   */
  private readonly bindings = new Map<InjectableToken<any>, Binding<any>[]>();

  /**
   * Registers the provided Binding at the Registry indexed by the provided Token.
   *
   * @param token Token used as index of the Binding.
   * @param binding Binding to be added to the Registry.
   */
  public set<T>(token: InjectableToken<T>, binding: Binding<T>): void {
    if (!this.has(token)) {
      this.bindings.set(token, []);
    }

    this.bindings.get(token)!.push(binding);
  }

  /**
   * Returns the last registered Binding based on the provided Token.
   *
   * @param token Index Token.
   * @throws {TokenNotRegisteredException} The provided Token is not registered.
   * @returns Last registered Binding.
   */
  public get<T>(token: InjectableToken<T>): Binding<T> {
    if (!this.has(token)) {
      throw new TokenNotRegisteredException(token);
    }

    return this.bindings.get(token)!.at(-1)!;
  }

  /**
   * Returns all the Bindings registered at the provided Token.
   *
   * @param token Index Token.
   * @throws {TokenNotRegisteredException} The provided Token is not registered.
   * @returns Registered Bindings.
   */
  public getAll<T>(token: InjectableToken<T>): Binding<T>[] {
    if (!this.has(token)) {
      throw new TokenNotRegisteredException(token);
    }

    return this.bindings.get(token)!;
  }

  /**
   * Checks if the provided Token is already registered.
   *
   * @param token Token to be checked.
   */
  public has<T>(token: InjectableToken<T>): boolean {
    return this.bindings.has(token);
  }

  /**
   * Deletes a Token from the Registry.
   *
   * @param token Token to be deleted.
   */
  public delete<T>(token: InjectableToken<T>): void {
    this.bindings.delete(token);
  }

  /**
   * Deletes all the Tokens and their respective Bindings from the Registry.
   */
  public clear(): void {
    this.bindings.clear();
  }
}
