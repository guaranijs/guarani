import { KeyObject } from 'crypto';

import { JsonWebKeyParameters } from '../jsonwebkey.parameters';

/**
 * Interface of a JSON Web Key Backend.
 */
export interface JsonWebKeyBackend {
  /**
   * Private Parameters of the JSON Web Key.
   */
  readonly privateParameters: string[];

  /**
   * Loads the provided JSON Web Key Parameters into a NodeJS Crypto Key.
   *
   * @param parameters JSON Web Key Parameters.
   * @returns NodeJS Crypto Key object.
   */
  load(parameters: JsonWebKeyParameters): KeyObject;
}
