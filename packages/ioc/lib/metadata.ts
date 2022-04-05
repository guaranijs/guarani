import { Constructor, Dict, Optional } from '@guarani/types';

import { Constants } from './constants';
import { InjectableToken } from './tokens';

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
  readonly multiple: boolean;

  /**
   * Token registered within the Container.
   */
  readonly token: InjectableToken<T>;

  /**
   * Defines if the token will be injected into a static property.
   */
  readonly isStatic: boolean;
}

/**
 * Returns a list containing the types of the parameters of the Constructor.
 * If no `constructor()` is defined, it will return an empty list.
 *
 * @param target Constructor to be inspected.
 * @returns List of the parameter types of the Constructor.
 */
export function getDesignParamTypes(target: object): any[] {
  return Reflect.getMetadata(Constants.DESIGN_PARAM_TYPES, target) ?? [];
}

/**
 * Returns the list of Injectable types metadata registered at the target.
 *
 * @param target Constructor to be inspected.
 * @returns List of Injectable types metadata.
 */
export function getParamTypes<T>(target: Constructor<T>): Optional<InjectableType<any>[]> {
  return Reflect.getMetadata(Constants.PARAM_TYPES, target);
}

/**
 * Defines the target's constructor parameters' tokens.
 *
 * It works similarly to `design:paramtypes`, with the difference that it uses
 * the name of the injected token instead of the type, if provided, based on the
 * use of the decorators `@Inject()` and `@InjectAll()`.
 *
 * @param target Constructor to be inspected.
 * @param types Injectable types based on the target's constructor parameters.
 */
export function setParamTypes(target: object, types: InjectableType<any>[]): void {
  Reflect.defineMetadata(Constants.PARAM_TYPES, types, target);
}

/**
 * Returns the dictionary of the tokens injected in the target's constructor
 * by the decorators `@Inject()` and `@InjectAll()`, indexed by each token's
 * position in the constructor as its keys.
 *
 * @param target Constructor to be inspected.
 * @returns Dictionary of the target constructor's parameter tokens.
 */
export function getParamTokens(target: object): Optional<Dict<InjectableType<any>>> {
  return Reflect.getMetadata(Constants.PARAM_TOKENS, target);
}

/**
 * Defines a dictionary of Injectable types indexed by the position at the
 * constructor that the token described will be injected into.
 *
 * @param target Constructor to be inspected.
 * @param tokens Dictionary of injectable types to be registered.
 */
export function setParamTokens(target: object, tokens: Dict<InjectableType<any>>): void {
  Reflect.defineMetadata(Constants.PARAM_TOKENS, tokens, target);
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
 * @param target Constructor to be inspected.
 * @param parameterIndex Index of the parameter at the constructor.
 * @param token Token to be injected.
 * @param multiple Injects the last provider or all the providers.
 */
export function defineParamInjectableType(
  target: object,
  parameterIndex: number,
  token: InjectableToken<any>,
  multiple: boolean
): void {
  const tokens = getParamTokens(target) ?? {};
  tokens[parameterIndex] = { multiple, token, isStatic: false };
  setParamTokens(target, tokens);
}

/**
 * Returns the type of the requested property.
 *
 * @param target Constructor to be inspected.
 * @param propertyKey Name of the property.
 * @returns Type of the property.
 */
export function getDesignPropType(target: object, propertyKey: string | symbol): Optional<any> {
  return Reflect.getMetadata(Constants.DESIGN_PROP_TYPE, target, propertyKey);
}

/**
 * Returns the dictionary of the tokens injected in the target's properties
 * by the decorators `@Inject()` and `@InjectAll()` with the names
 * of the decorated properties as its keys.
 *
 * @param target Constructor to be inspected.
 * @returns Dictionary of the target properties' tokens.
 */
export function getPropTokens(target: object): Optional<Map<string | symbol, InjectableType<any>>> {
  return Reflect.getMetadata(Constants.PROP_TOKENS, target);
}

/**
 * Defines a dictionary of Injectable types indexed by the name of the
 * properties of the target that the token described will be injected into.
 *
 * @param target Constructor to be inspected.
 * @param tokens Dictionary of injectable types to be registered.
 */
export function setPropTokens(target: object, tokens: Map<string | symbol, InjectableType<any>>): void {
  Reflect.defineMetadata(Constants.PROP_TOKENS, tokens, target);
}

/**
 * Defines an entry at the Property Tokens dictionary containing the Injectable
 * type representing the provided token.
 *
 * This entry is indexed by the name of the property at the instance
 * it is supposed to be injected into, and it contains a descriptor
 * of whether it was injected with `@Inject()` or `@InjectAll()`,
 * as well as the token that will be used in the resolution.
 *
 * @param target Constructor to be inspected.
 * @param propertyKey Name of the property at the instance.
 * @param token Token to be injected.
 * @param multiple Injects the last provider or all the providers.
 */
export function definePropertyInjectableType<T>(
  target: object,
  propertyKey: string | symbol,
  token: InjectableToken<T>,
  multiple: boolean,
  isStatic: boolean
): void {
  const tokens = getPropTokens(target) ?? new Map<string | symbol, InjectableType<any>>();
  tokens.set(propertyKey, { multiple, token, isStatic });
  setPropTokens(target, tokens);
}
