import { base64UrlDecodeInt, toBuffer } from '@guarani/utils'

import { BitString, ObjectId, PEMEncoder, Sequence } from '../lib'

describe('PEM Encoder', () => {
  it('should encode an ASN.1 Node into a PEM string.', () => {
    const x = toBuffer(
      base64UrlDecodeInt('4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og')
    )

    const y = toBuffer(
      base64UrlDecodeInt('mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8')
    )

    const ecKey = new Sequence(
      new Sequence(
        new ObjectId('1.2.840.10045.2.1'),
        new ObjectId('1.2.840.10045.3.1.7')
      ),
      new BitString(Buffer.concat([toBuffer(0x04), x, y]))
    )

    expect(PEMEncoder(ecKey, 'PUBLIC KEY')).toEqual(
      '-----BEGIN PUBLIC KEY-----\n' +
        'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4c/cS6IT6jaVQeobt/6BDCTmzBaB\n' +
        'OTmmiSCpjd5a6Oiaes+cIVMOQZ0TCKVptqozsPPCUAWB61lOY/3Jwc/EXw==\n' +
        '-----END PUBLIC KEY-----\n'
    )
  })
})
