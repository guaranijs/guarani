import { Buffer } from 'buffer';

import { InvalidJsonWebEncryptionException } from '../../../exceptions/invalid-jsonwebencryption.exception';
import { InvalidJsonWebKeyException } from '../../../exceptions/invalid-jsonwebkey.exception';
import { OctetSequenceKey } from '../../../jwk/backends/octet-sequence/octet-sequence.key';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { JsonWebEncryptionKeyWrapBackend } from './jsonwebencryption-keywrap.backend';

/**
 * Implementation of the JSON Web Encryption Direct Key Wrap Backend.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7518.html#section-4.5
 */
class DirBackend extends JsonWebEncryptionKeyWrapBackend {
  /**
   * Instantiates a new JSON Web Encryption Direct Key Wrap Backend to Wrap and Unwrap Content Encryption Keys.
   */
  public constructor() {
    super('dir');
  }

  /**
   * Returns an empty Buffer as the Wrapped Key since the Backend does not Wrap the provided Content Encryption Key.
   *
   * @param enc JSON Web Encryption Content Encryption Backend.
   * @param key JSON Web Key to be used as the Content Encryption Key used to Encrypt the Plaintext.
   * @returns Wrap Key as the Content Encryption Key and an empty Buffer as the Wrapped Content Encryption Key.
   */
  public async wrap(enc: JsonWebEncryptionContentEncryptionBackend, key: OctetSequenceKey): Promise<[Buffer, Buffer]> {
    this.validateJsonWebKey(key);

    const cek = key.cryptoKey.export();
    const ek = Buffer.alloc(0);

    enc.validateContentEncryptionKey(cek);

    return [cek, ek];
  }

  /**
   * Returns the provided JSON Web Key as the Content Encryption Key.
   *
   * @param enc JSON Web Encryption Content Encryption Algorithm.
   * @param key JSON Web Key used as the Content Encryption Key.
   * @param ek ~Wrapped Content Encryption Key~.
   * @returns Provided JSON Web Key as the Content Encryption Key.
   */
  public async unwrap(
    enc: JsonWebEncryptionContentEncryptionBackend,
    key: OctetSequenceKey,
    ek: Buffer
  ): Promise<Buffer> {
    if (ek.length !== 0) {
      throw new InvalidJsonWebEncryptionException('Expected the Encrypted Content Encryption Key to be empty.');
    }

    const cek = key.cryptoKey.export();

    enc.validateContentEncryptionKey(cek);

    return cek;
  }

  /**
   * Checks if the provided JSON Web Key can be used by the requesting JSON Web Encryption Key Wrap Backend.
   *
   * @param key JSON Web Key to be checked.
   * @throws {InvalidJsonWebKeyException} The provided JSON Web Key is invalid.
   */
  protected override validateJsonWebKey(key: OctetSequenceKey): void {
    super.validateJsonWebKey(key);

    if (key.kty !== 'oct') {
      throw new InvalidJsonWebKeyException(
        'This JSON Web Encryption Key Wrap Algorithm only accepts "oct" JSON Web Keys.'
      );
    }
  }
}

/**
 * Direct use of a shared symmetric key as the CEK.
 */
export const dir = new DirBackend();
