import { KeyObject } from 'crypto';

import { JsonWebKeyAlgorithmParams } from './jsonwebkey-algorithm.params';
import { ExportJsonWebKeyOptions, GenerateJsonWebKeyOptions } from './types';

/**
 * Interface with the methods' signatures used by the JSON Web Key Algorithm implementations.
 *
 * Implementations of custom JSON Web Key Algorithms **MUST** implement this interface
 * in order to be compliant with the rest of the library.
 */
export interface JsonWebKeyAlgorithm {
  /**
   * Exports the provided JSON Web Key into a String.
   *
   * @param key JSON Web Key to be exported.
   * @param options Parameters for exporing the JSON Web Key.
   * @returns Resulting String.
   */
  export(key: KeyObject, options: ExportJsonWebKeyOptions): Promise<string>;

  /**
   * Exports the provided JSON Web Key into a Buffer.
   *
   * @param key JSON Web Key to be exported.
   * @param options Parameters for exporing the JSON Web Key.
   * @returns Resulting Buffer.
   */
  export(key: KeyObject, options: ExportJsonWebKeyOptions): Promise<Buffer>;

  /**
   * Generates a JSON Web Key based on the provided parameters.
   *
   * @param options Parameters for the generation of a JSON Web Key.
   * @returns Generated JSON Web Key.
   */
  generate(options: GenerateJsonWebKeyOptions): Promise<any>;

  /**
   * Loads the provided JSON Web Key into a JSON Web Key.
   *
   * @param jwk JSON Web Key to be loaded.
   * @returns Loaded JSON Web Key.
   */
  load(jwk: JsonWebKeyAlgorithmParams): KeyObject;
}
