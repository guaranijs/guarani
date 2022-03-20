import { createPrivateKey, createPublicKey } from 'crypto';
import { writeFileSync } from 'fs';
import { join } from 'path';

const pem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxjpFydzTbByzL5jhEa2y
QO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDByhgKNzeBo6Vq3IRrkrlt
p97LKWfeZdM+leGt8+UTZEWqrNf3UGOEj8kI6lbjiG+Sn/yNHcVA9qBV22norZkg
XctHLeFbY6TmpD+I8/UiplZUHoc9KlYc7crCQRa+O7tKFDULNTMjjifc0dmuYP7Z
cYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMRQPX8GcyTxfbkOrSTFueK
MHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf/u20S5JG5iK0nsm1uZYu+02XN
+wIDAQAB
-----END PUBLIC KEY-----`;

const key = createPublicKey(pem);

const der = key.export({ format: 'der', type: 'spki' });

writeFileSync(join(process.cwd(), 'tests', 'keys', 'rsa', 'rsa_spki_public_key.bin'), der);
