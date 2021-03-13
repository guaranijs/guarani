import { KeyObject } from 'node:crypto'
import { InvalidKey } from '../../exceptions'

/**
 * Defines the functionalities of symmetric keys.
 */
export interface SymmetricKey {
  /**
   * Returns a native secret key.
   */
  getSecretKey(): KeyObject
}

/**
 * Defines the functionalities of asymmetric keys.
 */
export interface AsymmetricKey {
  /**
   * Returns a native public key.
   */
  getPublicKey(): KeyObject

  /**
   * Returns a native private key.
   */
  getPrivateKey?(): KeyObject
}

/**
 * Base interface for the JWK algorithms.
 */
export interface JWKAParams {
  /**
   * Represents the type of the key.
   */
  kty?: string
}

/**
 * Base class for creating a JsonWebKey Algorithm.
 */
export abstract class JWKAlgorithm {
  /**
   * Defines the type of the key supported by the algorithm.
   */
  public abstract readonly kty: string

  /**
   * Instantiates a new Algorithm based on the provided key.
   *
   * @param data - Data of the JsonWebKey in object format.
   */
  public constructor(data: JWKAParams) {
    if (typeof data.kty !== 'string')
      throw new InvalidKey('Invalid parameter "kty".')
  }

  /**
   * Exports the key's data into a formatted string based on
   * whether the key is symmetric or asymmetric.
   */
  public abstract export(...args: any): string
}
