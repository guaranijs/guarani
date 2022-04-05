import { InvalidJsonWebKeyException } from '../../lib/exceptions/invalid-json-web-key.exception';
import { KeyOperation } from '../../lib/jwk/types/key-operation';
import { PublicKeyUse } from '../../lib/jwk/types/public-key-use';
import { JsonWebKeyMock } from './mocks/jsonwebkey.mock';

const invalidUses: any[] = [null, true, 12, 12n, 12.3, Buffer.alloc(1), Symbol.for('foo'), () => {}, [], {}];

const invalidKeyOps: any[] = [
  null,
  true,
  12,
  12n,
  12.3,
  'invalidKeyOp',
  Buffer.alloc(1),
  Symbol.for('foo'),
  () => {},
  {},
  [],
  [123],
];

const invalidUseKeyOps: [PublicKeyUse, KeyOperation[]][] = [
  ['enc', ['sign']],
  ['enc', ['verify']],
  ['sig', ['decrypt']],
  ['sig', ['encrypt']],
  ['sig', ['wrapKey']],
  ['sig', ['unwrapKey']],
  ['sig', ['deriveKey']],
  ['sig', ['deriveBits']],
];

const invalidAlgs: any[] = [null, true, 12, 12n, 12.3, Buffer.alloc(1), Symbol.for('foo'), () => {}, [], {}];

const invalidKeyIds: any[] = [null, true, 12, 12n, 12.3, Buffer.alloc(1), Symbol.for('foo'), () => {}, [], {}];

describe('JSON Web Key', () => {
  it.each(invalidUses)('should reject an invalid "use".', (invalidKeyUse) => {
    expect(() => new JsonWebKeyMock({ use: invalidKeyUse })).toThrow(InvalidJsonWebKeyException);
  });

  it.each(invalidKeyOps)('should reject an invalid "key_ops".', (invalidKeyOp) => {
    expect(() => new JsonWebKeyMock({ key_ops: invalidKeyOp })).toThrow(InvalidJsonWebKeyException);
  });

  it('should reject duplicate "key_ops".', () => {
    expect(() => new JsonWebKeyMock({ key_ops: ['sign', 'sign', 'verify'] })).toThrow(InvalidJsonWebKeyException);
  });

  it.each(invalidUseKeyOps)(
    'should reject an invalid combination of "use" and "key_ops".',
    (invalidUse, invalidKeyOps) => {
      expect(() => new JsonWebKeyMock({ use: invalidUse, key_ops: invalidKeyOps })).toThrow(InvalidJsonWebKeyException);
    }
  );

  it.each(invalidAlgs)('should reject an invalid "alg".', (invalidAlg) => {
    expect(() => new JsonWebKeyMock({ alg: invalidAlg })).toThrow(InvalidJsonWebKeyException);
  });

  it.each(invalidKeyIds)('should reject an invalid "kid".', (invalidKeyId) => {
    expect(() => new JsonWebKeyMock({ kid: invalidKeyId })).toThrow(InvalidJsonWebKeyException);
  });
});
