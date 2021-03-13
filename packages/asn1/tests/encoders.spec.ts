import { Base64Url, Primitives } from '@guarani/utils'

import { Encoders, Nodes } from '../lib'

describe('PEM Encoder', () => {
  it('should encode an ASN.1 Node into a PEM string.', () => {
    const x = Primitives.toBuffer(
      Base64Url.decodeInt('4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og')
    )

    const y = Primitives.toBuffer(
      Base64Url.decodeInt('mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8')
    )

    const ecKey = new Nodes.Sequence(
      new Nodes.Sequence(
        new Nodes.ObjectId('1.2.840.10045.2.1'),
        new Nodes.ObjectId('1.2.840.10045.3.1.7')
      ),
      new Nodes.BitString(Buffer.concat([Primitives.toBuffer(0x04), x, y]))
    )

    expect(Encoders.PEM(ecKey, 'PUBLIC KEY')).toEqual(
      '-----BEGIN PUBLIC KEY-----\n' +
        'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4c/cS6IT6jaVQeobt/6BDCTmzBaB\n' +
        'OTmmiSCpjd5a6Oiaes+cIVMOQZ0TCKVptqozsPPCUAWB61lOY/3Jwc/EXw==\n' +
        '-----END PUBLIC KEY-----\n'
    )
  })
})
