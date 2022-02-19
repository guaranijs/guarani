import 'reflect-metadata';
import { fromPEM } from '@guarani/utils';
import { EcPrivateSec1 } from '../tests/fixtures/ec/ec-private-sec1';
import { DerDecoder } from './decoders/der.decoder';

const pem = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIG8FV+lcfkznximDjwHLtsYWo9yVM7PjHLAvrLmh5xQaoAoGCCqGSM49
AwEHoUQDQgAE4c/cS6IT6jaVQeobt/6BDCTmzBaBOTmmiSCpjd5a6Oiaes+cIVMO
QZ0TCKVptqozsPPCUAWB61lOY/3Jwc/EXw==
-----END EC PRIVATE KEY-----`;

const buffer = fromPEM(pem);

const decoder = new DerDecoder(buffer, EcPrivateSec1);
const decoded = decoder.decode();

console.log(decoded);
