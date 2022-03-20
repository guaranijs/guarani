import { EcKeyParams } from './jwk/algorithms/ec/ec-key.params';
import { OctKeyParams } from './jwk/algorithms/oct/oct-key.params';
import { RsaKeyParams } from './jwk/algorithms/rsa/rsa-key.params';
import { JsonWebKeySet } from './jwks/jsonwebkeyset';
import { JsonWebKeySetParams } from './jwks/jsonwebkeyset.params';

async function main(): Promise<void> {
  const params: JsonWebKeySetParams = {
    keys: [
      <OctKeyParams>{
        kty: 'oct',
        k: 'qDM80igvja4Tg_tNsEuWDhl2bMM6_NgJEldFhIEuwqQ',
        kid: 'octkey',
      },
      <EcKeyParams>{
        kty: 'EC',
        crv: 'P-256',
        x: '4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og',
        y: 'mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8',
        kid: 'eckey',
      },
      <RsaKeyParams>{
        kty: 'RSA',
        n: 'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDByhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-Sn_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tKFDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMRQPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S5JG5iK0nsm1uZYu-02XN-w',
        e: 'AQAB',
        kid: 'rsakey',
      },
    ],
  };

  const jwks = JsonWebKeySet.parse(JSON.stringify(params));

  const key = jwks.getKeyOrNone({ kid: 'octkey', use: 'sig' });

  console.log(key);
}

main();
