import { JsonWebKey } from './jwk/jsonwebkey';

async function main() {
  const key = new JsonWebKey({
    kty: 'RSA',
    n: 'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDByhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-Sn_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tKFDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMRQPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S5JG5iK0nsm1uZYu-02XN-w',
    e: 'AQAB',
  });

  console.log(key.toJSON());

  const exported = await key.export({ kty: 'RSA', encoding: 'pem', format: 'spki', type: 'public' });

  console.log(exported);
}

main();
