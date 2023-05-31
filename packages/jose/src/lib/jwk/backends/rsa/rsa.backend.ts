import { generateKeyPair } from 'crypto';
import { promisify } from 'util';

import { JsonWebKeyBackend } from '../jsonwebkey.backend';
import { GenerateRsaKeyOptions } from './generate-rsa-key.options';
import type { RsaKey } from './rsa.key';
import { RsaKeyParameters } from './rsa.key.parameters';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Implementation of the RSA JSON Web Key Backend.
 */
export class RsaBackend implements JsonWebKeyBackend {
  /**
   * Loads the provided RSA JSON Web Key Parameters into an RSA JSON Web Key.
   *
   * @param parameters RSA JSON Web Key Parameters.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns RSA JSON Web Key.
   */
  public async load(data: RsaKeyParameters, additionalParameters?: Partial<RsaKeyParameters>): Promise<RsaKey> {
    return new (await import('./rsa.key')).RsaKey(data, additionalParameters);
  }

  /**
   * Generates a new RSA JSON Web Key on the fly based on the provided options.
   *
   * @param options Options used to generate the RSA JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public async generate(
    options: GenerateRsaKeyOptions,
    additionalParameters?: Partial<RsaKeyParameters>
  ): Promise<RsaKey> {
    if (!Number.isInteger(options.modulus)) {
      throw new TypeError('The value of the RSA Modulus must be an integer.');
    }

    if (options.modulus < 2048) {
      throw new TypeError('The value of the RSA Modulus must be at least 2048.');
    }

    if (typeof options.publicExponent !== 'undefined' && !Number.isInteger(options.publicExponent)) {
      throw new TypeError('The value of the RSA Public Exponent must be an integer.');
    }

    const { privateKey } = await generateKeyPairAsync('rsa', {
      modulusLength: options.modulus,
      publicExponent: options.publicExponent ?? 0x010001,
    });

    const data = privateKey.export({ format: 'jwk' }) as RsaKeyParameters;

    return new (await import('./rsa.key')).RsaKey(data, additionalParameters);
  }
}
