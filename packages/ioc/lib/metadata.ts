import { Constants } from './constants'
import { InjectableToken } from './tokens'
import { Dict } from './types'

/**
 * Describes the format of the object stored at the Injectable's
 * `guarani:paramtokens` metadata entry.
 *
 * The `token` parameter defines the token registered at the Container,
 * while the `multiple` parameter defines whether or not the injected
 * constructor parameter was used with `@Inject()` or `@InjectAll()`.
 */
export interface InjectableType<T> {
  /**
   * Defines the type of the value to be injected.
   *
   * If it is `true`, it will inject an array of all the resolved providers
   * registered for the token. If it is `false`, it will inject only the
   * last entry of the token.
   */
  readonly multiple: boolean

  /**
   * Token registered within the Container.
   */
  readonly token: InjectableToken<T>
}

/**
 * Returns a list containing the types of the parameters of the Constructor.
 * If no `constructor()` is defined, it will return an empty list.
 *
 * @param target - Constructor to be inspected.
 * @returns List of the types of the parameters of the Constructor.
 */
export function getDesignParamTypes(target: Function): any[] {
  return Reflect.getMetadata(Constants.DESIGN_PARAM_TYPES, target) ?? []
}

/**
 * Returns the list of Injectable types metadata registered at the target.
 *
 * @param target - Constructor to be inspected.
 * @returns Injectable types metadata.
 */
export function getParamTypes(target: Function): InjectableType<any>[] {
  return Reflect.getMetadata(Constants.PARAM_TYPES, target)
}

/**
 * Defines the target's constructor parameters' tokens.
 *
 * It works similarly to `design:paramtypes`, with the difference that it uses
 * the name of the injected token instead of the type, if provided, based on the
 * use of the decorators `@Inject()` and `@InjectAll()`.
 *
 * @param target - Constructor to be inspected.
 * @param types - Injectable types based on the target's constructor parameters.
 */
export function setParamTypes(
  target: Function,
  types: InjectableType<any>[]
): void {
  Reflect.defineMetadata(Constants.PARAM_TYPES, types, target)
}

/**
 * Returns the dictionary of the tokens injected in the target's constructor
 * by the decorators `@Inject()` and `@InjectAll()`.
 *
 * If no items have been set, it returns an empty dictionary. Otherwise,
 * it returns a dictionary with the indices of each token's position in
 * the constructor as its keys.
 *
 * @param target - Constructor to be inspected.
 * @returns Dictionary of the target constructor's parameter tokens.
 */
export function getParamTokens(target: Function): Dict<InjectableType<any>> {
  return Reflect.getMetadata(Constants.PARAM_TOKENS, target)
}

/**
 * Defines a dictionary of Injectable types indexed by the position at the
 * constructor that the token described will be injected into.
 *
 * @param target - Constructor to be inspected.
 * @param tokens - Dictionary of injectable types to be registered.
 */
export function setParamTokens(
  target: Function,
  tokens: Dict<InjectableType<any>>
): void {
  Reflect.defineMetadata(Constants.PARAM_TOKENS, tokens, target)
}

/**
 * Defines an entry at the Parameter Tokens dictionary containing the Injectable
 * type representing the provided token.
 *
 * This entry is indexed by the position at the target's constructor
 * it is supposed to be injected into, and it contains a descriptor
 * of whether it was injected with `@Inject()` or `@InjectAll()`,
 * as well as the token that will be used in the resolution.
 *
 * @param target - Constructor to be inspected.
 * @param parameterIndex - Index of the parameter at the constructor.
 * @param token - Token to be injected.
 * @param multiple - Injects the last provider or all the providers.
 */
export function defineParamInjectableType<T>(
  target: Function,
  parameterIndex: number,
  token: InjectableToken<T>,
  multiple: boolean
): void {
  const tokens: Dict<InjectableType<any>> = getParamTokens(target) ?? {}
  tokens[parameterIndex] = { multiple, token }
  setParamTokens(target, tokens)
}
