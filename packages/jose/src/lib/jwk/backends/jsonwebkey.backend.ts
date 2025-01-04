import { Buffer } from 'buffer';
import { createHash, KeyObject } from 'crypto';

import { JSON } from '@guarani/primitives';
import { Dictionary } from '@guarani/types';

import { JsonWebKey } from '../jsonwebkey';
import { JsonWebKeyParameters } from '../jsonwebkey.parameters';

/**
 * Interface of a JSON Web Key Backend.
 */
export abstract class JsonWebKeyBackend {
  /**
   * Loads the provided JSON Web Key Parameters into a JSON Web Key.
   *
   * @param parameters JSON Web Key Parameters.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns JSON Web Key.
   */
  public abstract load(
    parameters: JsonWebKeyParameters,
    additionalParameters?: Partial<JsonWebKeyParameters>,
  ): Promise<JsonWebKey>;

  /**
   * Generates a new JSON Web Key on the fly based on the provided options.
   *
   * @param options Options used to generate the JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public abstract generate(
    options: Dictionary<any>,
    additionalParameters?: Partial<JsonWebKeyParameters>,
  ): Promise<JsonWebKey>;

  /**
   * Parses the Parameters of the JSON Web Key into a NodeJS Crypto Key.
   *
   * @param parameters Parameters of the JSON Web Key.
   */
  public abstract getCryptoKey(parameters: JsonWebKeyParameters): KeyObject;

  /**
   * Returns a list with the private parameters of the JSON Web Key.
   */
  public abstract getPrivateParameters(): string[];

  /**
   * Returns the parameters used to calculate the Thumbprint of the JSON Web Key in lexicographic order.
   *
   * @param parameters Parameters of the JSON Web Key.
   */
  protected abstract getThumbprintParameters(parameters: JsonWebKeyParameters): JsonWebKeyParameters;

  /**
   * Returns the thumbprint of the provided JSON Web Key according to **RFC 7638 JSON Web Key (JWK) Thumbprint**.
   *
   * The hash algorithm **SHA-256** is used to generate the thumbprint.
   *
   * @see https://www.rfc-editor.org/rfc/rfc7638.html
   *
   * @param parameters Parameters of the JSON Web Key.
   */
  public getThumbprint(parameters: JsonWebKeyParameters): Buffer {
    const thumbprintParameters = this.getThumbprintParameters(parameters);
    return createHash('sha256').update(JSON.stringify(thumbprintParameters), 'utf8').digest();
  }
}
