import { createSecretKey, randomBytes } from 'crypto';
import { promisify } from 'util';

import { JsonWebKeyBackend } from '../jsonwebkey.backend';
import { GenerateOctetSequenceKeyOptions } from './generate-octet-sequence-key.options';
import type { OctetSequenceKey } from './octet-sequence.key';
import { OctetSequenceKeyParameters } from './octet-sequence.key.parameters';

const randomBytesAsync = promisify(randomBytes);

/**
 * Implementation of the Octet Sequence JSON Web Key Backend.
 */
export class OctetSequenceBackend implements JsonWebKeyBackend {
  /**
   * Loads the provided Octet Sequence JSON Web Key Parameters into an Octet Sequence JSON Web Key.
   *
   * @param parameters Octet Sequence JSON Web Key Parameters.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   * @returns Octet Sequence JSON Web Key.
   */
  public async load(
    data: OctetSequenceKeyParameters,
    additionalParameters?: Partial<OctetSequenceKeyParameters>
  ): Promise<OctetSequenceKey> {
    return new (await import('./octet-sequence.key')).OctetSequenceKey(data, additionalParameters);
  }

  /**
   * Generates a new Octet Sequence JSON Web Key on the fly based on the provided options.
   *
   * @param options Options used to generate the Octet Sequence JSON Web Key.
   * @param additionalParameters Additional JSON Web Key Parameters. Overrides the attributes of `parameters`.
   */
  public async generate(
    options: GenerateOctetSequenceKeyOptions,
    additionalParameters?: Partial<OctetSequenceKeyParameters>
  ): Promise<OctetSequenceKey> {
    if (!Number.isInteger(options.length)) {
      throw new TypeError('The length of the Octet Sequence Secret must be an integer.');
    }

    if (options.length <= 0) {
      throw new TypeError('The length of the Octet Sequence Secret must be greater than zero.');
    }

    const bytes = await randomBytesAsync(options.length);
    const secretKey = createSecretKey(bytes);
    const data = secretKey.export({ format: 'jwk' }) as OctetSequenceKeyParameters;

    return new (await import('./octet-sequence.key')).OctetSequenceKey(data, additionalParameters);
  }
}
