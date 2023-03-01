import { JsonWebKey } from '../jsonwebkey';
import { JsonWebKeyParameters } from '../jsonwebkey.parameters';

/**
 * Interface of a JSON Web Key Backend.
 */
export interface JsonWebKeyBackend {
  /**
   * Loads the provided JSON Web Key Parameters into a JSON Web Key.
   *
   * @param parameters JSON Web Key Parameters.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns JSON Web Key.
   */
  load(parameters: JsonWebKeyParameters, additionalParameters?: Partial<JsonWebKeyParameters>): Promise<JsonWebKey>;

  /**
   * Generates a new JSON Web Key on the fly based on the provided options.
   *
   * @param options Options used to generate the JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  generate(options: Record<string, any>, additionalParameters?: Partial<JsonWebKeyParameters>): Promise<JsonWebKey>;
}
