import { InvalidJoseHeaderException } from '../exceptions/invalid-jose-header.exception';
import { UnsupportedAlgorithmException } from '../exceptions/unsupported-algorithm.exception';
import { JoseHeader } from '../jose/jose.header';
import { JsonWebSignatureBackend } from './backends/jsonwebsignature.backend';
import { JSONWEBSIGNATURE_REGISTRY } from './backends/jsonwebsignature.registry';
import { JsonWebSignatureAlgorithm } from './jsonwebsignature-algorithm.type';
import { JsonWebSignatureHeaderParameters } from './jsonwebsignature.header.parameters';

/**
 * Implementation of the JSON Web Signature Header.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7515.html#section-4
 */
export class JsonWebSignatureHeader extends JoseHeader implements JsonWebSignatureHeaderParameters {
  /**
   * JSON Web Signature Algorithm used to Sign and Verify the Token.
   */
  public readonly alg!: JsonWebSignatureAlgorithm;

  /**
   * JSON Web Signature Backend.
   */
  readonly #backend!: JsonWebSignatureBackend;

  /**
   * JSON Web Signature Backend.
   */
  public get backend(): JsonWebSignatureBackend {
    return this.#backend;
  }

  /**
   * Instantiates a new JSON Web Signature Header based on the provided Parameters.
   *
   * @param parameters JSON Web Signature Header Parameters.
   */
  public constructor(parameters: JsonWebSignatureHeaderParameters) {
    super(parameters);

    this.#backend = JSONWEBSIGNATURE_REGISTRY[parameters.alg];
  }

  /**
   * Checks if the provided data is a valid JSON Web Signature Header.
   *
   * @param data Data to be checked.
   */
  public static override isValidHeader(data: unknown): data is JsonWebSignatureHeaderParameters {
    return (
      super.isValidHeader(data) &&
      typeof data.alg === 'string' &&
      Object.keys(JSONWEBSIGNATURE_REGISTRY).includes(data.alg)
    );
  }

  /**
   * Validates the provided JSON Web Signature Header Parameters.
   *
   * @param parameters Parameters of the JSON Web Signature Header.
   */
  protected override validateParameters(parameters: JsonWebSignatureHeaderParameters): void {
    if (typeof parameters.alg !== 'string') {
      throw new InvalidJoseHeaderException('Invalid header parameter "alg".');
    }

    if (!Object.hasOwn(JSONWEBSIGNATURE_REGISTRY, parameters.alg)) {
      throw new UnsupportedAlgorithmException(`Unsupported JSON Web Signature Algorithm "${parameters.alg}".`);
    }

    super.validateParameters(parameters);
  }
}
