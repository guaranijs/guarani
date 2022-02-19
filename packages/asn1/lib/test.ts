import 'reflect-metadata';

import { fromPEM, toPEM } from '@guarani/utils';

import { EcPrivateSec1 } from '../tests/fixtures/ec/ec-private-sec1';
import { DerEncoder } from './encoders/der.encoder';
import { DerDecoder } from './decoders/der.decoder';

const basePem = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIG8FV+lcfkznximDjwHLtsYWo9yVM7PjHLAvrLmh5xQaoAoGCCqGSM49
AwEHoUQDQgAE4c/cS6IT6jaVQeobt/6BDCTmzBaBOTmmiSCpjd5a6Oiaes+cIVMO
QZ0TCKVptqozsPPCUAWB61lOY/3Jwc/EXw==
-----END EC PRIVATE KEY-----`;

const baseDer = fromPEM(basePem);

const decoder = new DerDecoder(baseDer, EcPrivateSec1);
const decoded = decoder.decode();

// console.log(decoded)

const encoder = new DerEncoder(decoded);
const encoded = encoder.encode();

console.log(encoded);

const pem = toPEM(encoded, 'EC PRIVATE KEY');

console.log(pem === basePem);
