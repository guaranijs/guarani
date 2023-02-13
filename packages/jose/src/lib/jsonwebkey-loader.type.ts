import { JsonWebEncryptionHeaderParameters } from './jwe/jsonwebencryption.header.parameters';
import { JsonWebKey } from './jwk/jsonwebkey';
import { JsonWebSignatureHeaderParameters } from './jws/jsonwebsignature.header.parameters';

/**
 * Signature of a JSON Web Key Loader, that loads a key based on the parameters of the provided JOSE Header.
 */
export type JsonWebKeyLoader = (
  header: JsonWebEncryptionHeaderParameters | JsonWebSignatureHeaderParameters
) => Promise<JsonWebKey>;
