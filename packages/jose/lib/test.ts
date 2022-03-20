import { isDeepStrictEqual } from 'util';
import { OctKey } from './jwk/algorithms/oct/oct.key';
import { JsonWebSignature } from './jws/jsonwebsignature';
import { JsonWebSignatureHeaderParams } from './jws/jsonwebsignature-header.params';

async function main() {
  const header: JsonWebSignatureHeaderParams = { typ: 'JWT', alg: 'HS256' };
  const payload = Buffer.from('{"iss":"joe","exp":1300819380,"http://example.com/is_root":true}', 'utf8');

  const jws = new JsonWebSignature(header, payload);

  const key = new OctKey({
    kty: 'oct',
    k: 'AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow',
  });

  const token = await jws.serializeCompact(key);

  console.log(token);

  const deserialized = await JsonWebSignature.deserializeCompact(token, key);

  console.log(isDeepStrictEqual(jws, deserialized));
}

main();
