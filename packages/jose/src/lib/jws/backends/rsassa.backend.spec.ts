import { Buffer } from 'buffer';
import { constants } from 'crypto';

import { InvalidJsonWebKeyException } from '../../exceptions/invalid-jsonwebkey.exception';
import { InvalidJsonWebSignatureException } from '../../exceptions/invalid-jsonwebsignature.exception';
import { RsaKey } from '../../jwk/backends/rsa/rsa.key';
import { RsaKeyParameters } from '../../jwk/backends/rsa/rsa.key.parameters';
import { JsonWebSignatureAlgorithm } from '../jsonwebsignature-algorithm.type';
import { PS256, PS384, PS512, RS256, RS384, RS512 } from './rsassa.backend';

const publicParameters: RsaKeyParameters = {
  kty: 'RSA',
  n:
    'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
    'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
    'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
    'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
    'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
    '5JG5iK0nsm1uZYu-02XN-w',
  e: 'AQAB',
};

const privateParameters: RsaKeyParameters = {
  ...publicParameters,
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
};

const message = Buffer.from('Super secret message.');

describe('JSON Web Signature RSASSA-PSS using SHA-256 and MGF1 with SHA-256 Backend', () => {
  it('should have "PS256" as its algorithm.', () => {
    expect(PS256['algorithm']).toEqual<JsonWebSignatureAlgorithm>('PS256');
  });

  it('should have "SHA256" as its "hash".', () => {
    expect(PS256['hash']).toEqual('SHA256');
  });

  it('should have "crypto.constants.RSA_PKCS1_PSS_PADDING" as its "padding".', () => {
    expect(PS256['padding']).toBe(constants.RSA_PKCS1_PSS_PADDING);
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => PS256['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "PS256" only accepts "RSA" JSON Web Keys.')
    );
  });

  it('should throw when signing with a public key.', async () => {
    const key = new RsaKey(publicParameters);

    await expect(PS256.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    const key = new RsaKey(publicParameters);
    await expect(PS256.verify(Buffer.alloc(0), message, key)).rejects.toThrow(new InvalidJsonWebSignatureException());
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const publicKey = new RsaKey(publicParameters);
    const privateKey = new RsaKey(privateParameters);

    await expect((async () => (signature = await PS256.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(PS256.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature RSASSA-PSS using SHA-384 and MGF1 with SHA-384 Backend', () => {
  it('should have "PS384" as its algorithm.', () => {
    expect(PS384['algorithm']).toEqual<JsonWebSignatureAlgorithm>('PS384');
  });

  it('should have "SHA384" as its "hash".', () => {
    expect(PS384['hash']).toEqual('SHA384');
  });

  it('should have "crypto.constants.RSA_PKCS1_PSS_PADDING" as its "padding".', () => {
    expect(PS384['padding']).toBe(constants.RSA_PKCS1_PSS_PADDING);
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => PS384['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "PS384" only accepts "RSA" JSON Web Keys.')
    );
  });

  it('should throw when signing with a public key.', async () => {
    const key = new RsaKey(publicParameters);

    await expect(PS384.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    const key = new RsaKey(publicParameters);
    await expect(PS384.verify(Buffer.alloc(0), message, key)).rejects.toThrow(new InvalidJsonWebSignatureException());
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const publicKey = new RsaKey(publicParameters);
    const privateKey = new RsaKey(privateParameters);

    await expect((async () => (signature = await PS384.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(PS384.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature RSASSA-PSS using SHA-512 and MGF1 with SHA-512 Backend', () => {
  it('should have "PS512" as its algorithm.', () => {
    expect(PS512['algorithm']).toEqual<JsonWebSignatureAlgorithm>('PS512');
  });

  it('should have "SHA512" as its "hash".', () => {
    expect(PS512['hash']).toEqual('SHA512');
  });

  it('should have "crypto.constants.RSA_PKCS1_PSS_PADDING" as its "padding".', () => {
    expect(PS512['padding']).toBe(constants.RSA_PKCS1_PSS_PADDING);
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => PS512['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "PS512" only accepts "RSA" JSON Web Keys.')
    );
  });

  it('should throw when signing with a public key.', async () => {
    const key = new RsaKey(publicParameters);

    await expect(PS512.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    const key = new RsaKey(publicParameters);
    await expect(PS512.verify(Buffer.alloc(0), message, key)).rejects.toThrow(new InvalidJsonWebSignatureException());
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const publicKey = new RsaKey(publicParameters);
    const privateKey = new RsaKey(privateParameters);

    await expect((async () => (signature = await PS512.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(PS512.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature RSASSA-PKCS1-v1_5 using SHA-256 Backend', () => {
  it('should have "RS256" as its algorithm.', () => {
    expect(RS256['algorithm']).toEqual<JsonWebSignatureAlgorithm>('RS256');
  });

  it('should have "SHA256" as its "hash".', () => {
    expect(RS256['hash']).toEqual('SHA256');
  });

  it('should have "crypto.constants.RSA_PKCS1_PADDING" as its "padding".', () => {
    expect(RS256['padding']).toBe(constants.RSA_PKCS1_PADDING);
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => RS256['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "RS256" only accepts "RSA" JSON Web Keys.')
    );
  });

  it('should throw when signing with a public key.', async () => {
    const key = new RsaKey(publicParameters);

    await expect(RS256.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    const key = new RsaKey(publicParameters);
    await expect(RS256.verify(Buffer.alloc(0), message, key)).rejects.toThrow(new InvalidJsonWebSignatureException());
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const publicKey = new RsaKey(publicParameters);
    const privateKey = new RsaKey(privateParameters);

    await expect((async () => (signature = await RS256.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(RS256.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature RSASSA-PKCS1-v1_5 using SHA-384 Backend', () => {
  it('should have "RS384" as its algorithm.', () => {
    expect(RS384['algorithm']).toEqual<JsonWebSignatureAlgorithm>('RS384');
  });

  it('should have "SHA384" as its "hash".', () => {
    expect(RS384['hash']).toEqual('SHA384');
  });

  it('should have "crypto.constants.RSA_PKCS1_PADDING" as its "padding".', () => {
    expect(RS384['padding']).toBe(constants.RSA_PKCS1_PADDING);
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => RS384['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "RS384" only accepts "RSA" JSON Web Keys.')
    );
  });

  it('should throw when signing with a public key.', async () => {
    const key = new RsaKey(publicParameters);

    await expect(RS384.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    const key = new RsaKey(publicParameters);
    await expect(RS384.verify(Buffer.alloc(0), message, key)).rejects.toThrow(new InvalidJsonWebSignatureException());
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const publicKey = new RsaKey(publicParameters);
    const privateKey = new RsaKey(privateParameters);

    await expect((async () => (signature = await RS384.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(RS384.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});

describe('JSON Web Signature RSASSA-PKCS1-v1_5 using SHA-512 Backend', () => {
  it('should have "RS512" as its algorithm.', () => {
    expect(RS512['algorithm']).toEqual<JsonWebSignatureAlgorithm>('RS512');
  });

  it('should have "SHA512" as its "hash".', () => {
    expect(RS512['hash']).toEqual('SHA512');
  });

  it('should have "crypto.constants.RSA_PKCS1_PADDING" as its "padding".', () => {
    expect(RS512['padding']).toBe(constants.RSA_PKCS1_PADDING);
  });

  it('should throw when not using an "RSA" key.', () => {
    const key = <any>{ kty: 'unknown' };
    Object.setPrototypeOf(key, RsaKey.prototype);

    expect(() => RS512['validateJsonWebKey'](key)).toThrow(
      new InvalidJsonWebKeyException('The JSON Web Signature Algorithm "RS512" only accepts "RSA" JSON Web Keys.')
    );
  });

  it('should throw when signing with a public key.', async () => {
    const key = new RsaKey(publicParameters);

    await expect(RS512.sign(message, key)).rejects.toThrow(
      new InvalidJsonWebKeyException('The provided JSON Web Key cannot be used to Sign a JSON Web Signature Message.')
    );
  });

  it('should throw when verifying a wrong signature.', async () => {
    const key = new RsaKey(publicParameters);
    await expect(RS512.verify(Buffer.alloc(0), message, key)).rejects.toThrow(new InvalidJsonWebSignatureException());
  });

  it('should sign and verify a message.', async () => {
    let signature!: Buffer;

    const publicKey = new RsaKey(publicParameters);
    const privateKey = new RsaKey(privateParameters);

    await expect((async () => (signature = await RS512.sign(message, privateKey)))()).resolves.not.toThrow();

    expect(signature).toEqual(expect.any(Buffer));

    await expect(RS512.verify(signature, message, publicKey)).resolves.not.toThrow();
  });
});
