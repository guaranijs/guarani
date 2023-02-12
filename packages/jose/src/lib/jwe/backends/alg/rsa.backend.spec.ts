import { Buffer } from 'buffer';

import { JsonWebKey } from '../../../jwk/jsonwebkey';
import { JsonWebKeyType } from '../../../jwk/jsonwebkey-type.enum';
import { JsonWebEncryptionContentEncryptionBackend } from '../enc/jsonwebencryption-content-encryption.backend';
import { RSA1_5, RSA_OAEP, RSA_OAEP_256, RSA_OAEP_384, RSA_OAEP_512 } from './rsa.backend';

const contentEncryptionKey = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);

const enc = <JsonWebEncryptionContentEncryptionBackend>{
  generateContentEncryptionKey: async (): Promise<Buffer> => contentEncryptionKey,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validateContentEncryptionKey: (_: Buffer): void => undefined,
};

const key = new JsonWebKey({
  kty: JsonWebKeyType.RSA,
  n:
    'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
    'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
    'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
    'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
    'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
    '5JG5iK0nsm1uZYu-02XN-w',
  e: 'AQAB',
  d:
    'cc2YrWia9LGRad0SMe0PrlmeeHSyRe5-u--QJcP4uF_5LYYzXIsjDJ9_iYh0S_YY' +
    'e6bLjqHOSp44OHvJqoXMX5j3-ECKnNjnUHMtRB2awXGBqBOhB8TqoQXgmXDi1jx_' +
    '6Fu8xH-vaSfpwrsN-0QzIcYHil6b8hwE0f0r6istBmL7iayJbnONp7na9ow2fUQl' +
    'nr41vsHZa4knTZ2E2kq5ntgaXlF6AIdc4DD_BZpf2alEbhQMX9T168ZsSyAs7wKS' +
    'd3ivhHRQayXEapUfZ_ykvnF4-DoVI1iRoowgZ-dlnv4Ff3YrKQ3Zv3uHJcF1BtWQ' +
    'VipOIHx4GyIc4bmTSA5PEQ',
  p:
    '-ZFuDg38cG-e5L6h1Jbn8ngifWgHx8m1gybkY7yEpU1V02fvQAMI1XG-1WpZm2xj' +
    'j218wNCj0BCEdmdBqZMk5RlzLagtfzQ3rPO-ucYPZ_SDmy8Udzr-sZLCqMFyLtxk' +
    'gMfGo4QZ6UJWYpTCCmZ92nS_pa4ePrQdlpnS4DLv_SM',
  q:
    'y1YdZtsbYfCOdsYBZrDpcvubwMN2fKRAzETYW5sqYv8XkxHG1J1zHH-zWJBQfZhT' +
    'biHPgHvoaFykEm9xhuA77RFGRXxFUrGBtfqIx_OG-kRWudmH83EyMzMoKQaW98RX' +
    'WqRO1JDlcs4_vzf_KN63zQKv5i4UdiiObQkZCYIOVUk',
  dp:
    'vqtDX-2DjgtZY_3Y-eiJMRBjmVgfiZ4r1RWjrCddWEVrauafPVKULy6F09s6tqnq' +
    'rqvBgjZk0ROtgCCHZB0NNRNqkdlJWUP1vWdDsf8FyjBfU_J2OlmSOOydV_zjVbX_' +
    '-vumYUsN2M5b3Vk1nmiLgplryhLq_JDzghnnqG6CN-0',
  dq:
    'tKczxBhSwbcpu5i70fLH1iJ5BNAkSyTbdSCNYQYAqKee2Elo76lbhixmuP6upIdb' +
    'SHO9mZd8qov0MXTV1lEOrNc2KbH5HTkb1wRZ1dwlReDFdKUxxjYBtb9zpM93_XVx' +
    'btSgPPbnBBL-S_OCPVtyzS_f-49hGoF52KHGns3v0hE',
  qi:
    'C4q9uIi-1fYhE0NTWVNzdhSi7fA3uznTWaW1X5LWBF4gBOcWvMMTfOZEaPjtY2WP' +
    'XaTWU4bdVN0GgktVLUDPLrSj533W1cOQZb_mm_7BFNrleelruT87bZhWPYQ979kl' +
    '6590ySgbH81pEM8FQW1JBATz0MYtUNZAt8N360vayE4',
});

describe('JSON Web Encryption Key Wrap RSA1_5 Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const [cek, ek] = await RSA1_5.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(expect.any(Buffer));
    expect(ek).toHaveLength(256);

    await expect(RSA1_5.unwrap(enc, key, ek)).resolves.toEqual(contentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap RSA_OAEP Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const [cek, ek] = await RSA_OAEP.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(expect.any(Buffer));
    expect(ek).toHaveLength(256);

    await expect(RSA_OAEP.unwrap(enc, key, ek)).resolves.toEqual(contentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap RSA_OAEP_256 Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const [cek, ek] = await RSA_OAEP_256.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(expect.any(Buffer));
    expect(ek).toHaveLength(256);

    await expect(RSA_OAEP_256.unwrap(enc, key, ek)).resolves.toEqual(contentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap RSA_OAEP_384 Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const [cek, ek] = await RSA_OAEP_384.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(expect.any(Buffer));
    expect(ek).toHaveLength(256);

    await expect(RSA_OAEP_384.unwrap(enc, key, ek)).resolves.toEqual(contentEncryptionKey);
  });
});

describe('JSON Web Encryption Key Wrap RSA_OAEP_512 Backend', () => {
  it('should wrap and unwrap a content encryption key.', async () => {
    const [cek, ek] = await RSA_OAEP_512.wrap(enc, key);

    expect(cek).toEqual(contentEncryptionKey);
    expect(ek).toEqual(expect.any(Buffer));
    expect(ek).toHaveLength(256);

    await expect(RSA_OAEP_512.unwrap(enc, key, ek)).resolves.toEqual(contentEncryptionKey);
  });
});