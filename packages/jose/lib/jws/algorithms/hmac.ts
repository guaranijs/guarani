import b64Url from '@guarani/base64url';

import { createHmac, createSecretKey } from 'crypto';

import { InvalidKey, InvalidSignature } from '../../exceptions';
import { OctKey } from '../../jwk';
import { SupportedHash } from '../../types';
import { JWSAlgorithm } from './jws-algorithm';

/**
 * Implementation of an HMAC Signature Algorithm.
 */
class HMACAlgorithm extends JWSAlgorithm {
  /**
   * Accepted key type.
   */
  public readonly kty: string = 'oct';

  /**
   * Instantiates a new HMAC Algorithm to sign and verify the messages.
   *
   * @param hash Hash algorithm used to sign and verify the messages.
   * @param algorithm Name of the algorithm.
   * @param keySize Minimum buffer size in bytes of the secret
   * accepted by the algorithm.
   */
  public constructor(
    protected readonly hash: SupportedHash,
    protected readonly algorithm: string,
    protected readonly keySize: number
  ) {
    super(hash, algorithm);
  }

  /**
   * Signs the provided message using HMAC.
   *
   * @param message Message to be signed.
   * @param key Key used to sign the message.
   * @returns Base64Url encoded signature.
   */
  public async sign(message: Buffer, key: OctKey): Promise<string> {
    this.checkKey(key);

    const secretKey = createSecretKey(key.export('binary'));
    const signature = createHmac(this.hash, secretKey).update(message).digest();

    return b64Url.encode(signature);
  }

  /**
   * Verifies the signature against a message using HMAC.
   *
   * @param signature Signature to be matched against the message.
   * @param message Message to be matched against the signature.
   * @param key Key used to verify the signature.
   * @throws {InvalidSignature} The signature does not match the message.
   */
  public async verify(signature: string, message: Buffer, key: OctKey): Promise<void> {
    this.checkKey(key);

    if ((await this.sign(message, key)) !== signature) {
      throw new InvalidSignature();
    }
  }

  /**
   * Checks if a key can be used by the requesting algorithm.
   *
   * @param key Key to be checked.
   * @throws {InvalidKey} The provided JSON Web Key is invalid.
   */
  protected checkKey(key: OctKey): void {
    super.checkKey(key);

    if (b64Url.byteLength(key.k) < this.keySize) {
      throw new InvalidKey(`The secret MUST be AT LEAST ${this.keySize} bytes.`);
    }
  }
}

/**
 * HMAC with SHA256.
 */
export const HS256 = new HMACAlgorithm('SHA256', 'HS256', 32);

/**
 * HMAC with SHA384.
 */
export const HS384 = new HMACAlgorithm('SHA384', 'HS384', 48);

/**
 * HMAC with SHA512.
 */
export const HS512 = new HMACAlgorithm('SHA512', 'HS512', 64);
