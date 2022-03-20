import { DerDecoder } from '@guarani/asn1';
import { encode } from '@guarani/base64url';
import { Constructor, Dict, Optional } from '@guarani/types';

import { generateKeyPair } from 'crypto';
import { promisify } from 'util';

import { JsonWebKeyParams } from '../../jsonwebkey';
import { EcKey, EcKeyParams } from './ec.key';
import { ECPrivateSEC1 } from './models/ec-private-sec1';
import { P256ECPrivateSEC1 } from './models/p256/p256-ec-private-sec1';
import { P384ECPrivateSEC1 } from './models/p384/p384-ec-private-sec1';
import { P521ECPrivateSEC1 } from './models/p521/p521-ec-private-sec1';
import { ELLIPTIC_CURVES } from './_types';

const generateKeyPairAsync = promisify(generateKeyPair);

const CURVE_TO_MODEL: Dict<Constructor<ECPrivateSEC1>> = {
  'P-256': P256ECPrivateSEC1,
  'P-384': P384ECPrivateSEC1,
  'P-521': P521ECPrivateSEC1,
};

/**
 * Creates a new Elliptic Curve Key.
 *
 * @param curve Name of the Elliptic Curve.
 * @param options Optional JSON Web Key Parameters.
 * @returns Instance of an EcKey.
 */
export async function generateEcKey(curve: string, options?: Optional<JsonWebKeyParams>): Promise<EcKey> {
  const curveMeta = ELLIPTIC_CURVES.find((ellipticCurve) => ellipticCurve.id === curve);

  if (curveMeta === undefined) {
    throw new TypeError(`Unsupported curve "${curve}".`);
  }

  const { privateKey } = await generateKeyPairAsync('ec', {
    namedCurve: curveMeta.name,
  });

  const der = privateKey.export({ format: 'der', type: 'sec1' });
  const decoder = new DerDecoder(der, CURVE_TO_MODEL[curve]);

  const sec1 = decoder.decode();

  const keyParams: EcKeyParams = {
    crv: curve,
    x: encode(sec1.publicKey.x),
    y: encode(sec1.publicKey.y),
    d: encode(sec1.d),
  };

  return new EcKey(keyParams, options);
}
