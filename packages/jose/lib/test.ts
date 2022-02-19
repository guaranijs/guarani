import 'reflect-metadata'

import { Decoder } from '@guarani/asn1'

import { P256PublicX509 } from './jwk/algorithms/ec/models/p256/p256-public-x509'

const basePem = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4c/cS6IT6jaVQeobt/6BDCTmzBaB
OTmmiSCpjd5a6Oiaes+cIVMOQZ0TCKVptqozsPPCUAWB61lOY/3Jwc/EXw==
-----END PUBLIC KEY-----`

const decoder = Decoder.PEM(basePem, P256PublicX509)

console.log(decoder.decode())
