import { JoseHeaderParameters } from './jose/jose.header.parameters';
import { JsonWebKey } from './jwk/jsonwebkey';

/**
 * Signature of a JSON Web Key Loader, that loads a key based on the parameters of the provided JOSE Header.
 */
export type JsonWebKeyLoader = (header: JoseHeaderParameters) => Promise<JsonWebKey | null>;
