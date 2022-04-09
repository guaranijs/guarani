import { JsonWebEncryptionHeaderParams } from '../jwe/jsonwebencryption-header.params';
import { JsonWebKey } from '../jwk/jsonwebkey';
import { JsonWebSignatureHeaderParams } from '../jws/jsonwebsignature-header.params';

/**
 * Signature of a JSON Web Key Loader, that loads a key based on the parameters of the provided JOSE Header.
 */
export type JsonWebKeyLoader = (
  header: JsonWebEncryptionHeaderParams | JsonWebSignatureHeaderParams
) => Promise<JsonWebKey>;
