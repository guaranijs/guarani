import { DerDecoder } from '@guarani/asn1';
import { Optional } from '@guarani/types';

import { generateKeyPair } from 'crypto';
import { promisify } from 'util';

import { JsonWebKeyParams } from '../../jsonwebkey';
import { RsaPrivatePkcs1 } from './models/rsa-private-pkcs1';
import { RsaKey } from './rsa.key';

const generateKeyPairAsync = promisify(generateKeyPair);

/**
 * Generates a new RSA Key.
 *
 * @param modulus Length of the Modulus of the Key in bits.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an RsaKey.
 */
export async function generateRsaKey(modulus: number, options?: Optional<JsonWebKeyParams>): Promise<RsaKey> {
  if (!Number.isInteger(modulus)) {
    throw new TypeError('Invalid parameter "modulus".');
  }

  if (modulus < 2048) {
    throw new Error('The modulus must be at least 2048 bits.');
  }

  const { privateKey } = await generateKeyPairAsync('rsa', {
    modulusLength: modulus,
    publicExponent: 0x010001,
  });

  const der = privateKey.export({ format: 'der', type: 'pkcs1' });
  const decoder = new DerDecoder(der, RsaPrivatePkcs1);

  const pkcs1 = decoder.decode();

  return new RsaKey(
    {
      n: encode(pkcs1.n),
      e: encode(pkcs1.e),
      d: encode(pkcs1.d),
      p: encode(pkcs1.p),
      q: encode(pkcs1.q),
      dp: encode(pkcs1.dp),
      dq: encode(pkcs1.dq),
      qi: encode(pkcs1.qi),
    },
    options
  );
}
