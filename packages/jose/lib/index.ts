if (Reflect == null || !('getMetadata' in Reflect)) {
  throw new Error(`@guarani/jose requires a Reflect Metadata polyfill.`)
}

export * from './exceptions'
export {
  JoseHeader,
  JoseHeaderParams,
  JoseProtectedAndUnprotectedHeaders
} from './jose.header'
export {
  JWEAlgorithm,
  JWECompression,
  JWEEncryption,
  JWEHeaderParams,
  JsonWebEncryption,
  JsonWebEncryptionHeader,
  SupportedJWEAlgorithm,
  SupportedJWECompression,
  SupportedJWEEncryption
} from './jwe'
export {
  EcKey,
  JsonWebKey,
  JsonWebKeyParams,
  JsonWebKeyset,
  OctKey,
  RsaKey
} from './jwk'
export {
  JWSAlgorithm,
  JWSHeaderParams,
  JWSProtectedAndUnprotectedHeaders,
  JsonWebSignature,
  JsonWebSignatureHeader,
  SupportedJWSAlgorithm
} from './jws'
export {
  JWTClaims,
  JWTClaimOptions,
  JsonWebToken,
  JsonWebTokenClaims
} from './jwt'
