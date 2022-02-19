import 'reflect-metadata';

import { decode } from '@guarani/base64url';
import { Constructor } from '@guarani/types';
import { fromPEM } from '@guarani/utils';

import { DerDecoder } from '../../lib/decoders/der.decoder';
import { EcPrivateSec1 } from '../fixtures/ec/ec-private-sec1';
import { EcPrivatePkcs8 } from '../fixtures/ec/ec-private-pkcs8';
import { EcPublicSpki } from '../fixtures/ec/ec-public-spki';
import { RsaPrivatePkcs1 } from '../fixtures/rsa/rsa-private-pkcs1';
import { RsaPrivatePkcs8 } from '../fixtures/rsa/rsa-private-pkcs8';
import { RsaPublicPkcs1 } from '../fixtures/rsa/rsa-public-pkcs1';
import { RsaPublicSpki } from '../fixtures/rsa/rsa-public-spki';

const pemToModel: [string, Constructor<object>, object][] = [
  // Elliptic Curve SEC1 Private Key.
  [
    '-----BEGIN EC PRIVATE KEY-----\n' +
      'MHcCAQEEIG8FV+lcfkznximDjwHLtsYWo9yVM7PjHLAvrLmh5xQaoAoGCCqGSM49\n' +
      'AwEHoUQDQgAE4c/cS6IT6jaVQeobt/6BDCTmzBaBOTmmiSCpjd5a6Oiaes+cIVMO\n' +
      'QZ0TCKVptqozsPPCUAWB61lOY/3Jwc/EXw==\n' +
      '-----END EC PRIVATE KEY-----',
    EcPrivateSec1,
    {
      version: 1n,
      d: decode('bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo', BigInt),
      oid: '1.2.840.10045.3.1.7',
      publicKey: {
        compression: 4n,
        x: decode('4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og', BigInt),
        y: decode('mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8', BigInt),
      },
    },
  ],

  // Elliptic Curve PKCS#8 Private Key.
  [
    '-----BEGIN PRIVATE KEY-----\n' +
      'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgbwVX6Vx+TOfGKYOP\n' +
      'Acu2xhaj3JUzs+McsC+suaHnFBqhRANCAAThz9xLohPqNpVB6hu3/oEMJObMFoE5\n' +
      'OaaJIKmN3lro6Jp6z5whUw5BnRMIpWm2qjOw88JQBYHrWU5j/cnBz8Rf\n' +
      '-----END PRIVATE KEY-----',
    EcPrivatePkcs8,
    {
      version: 0n,
      oid: {
        oid: '1.2.840.10045.2.1',
        curveOid: '1.2.840.10045.3.1.7',
      },
      privateKey: {
        version: 1n,
        d: decode('bwVX6Vx-TOfGKYOPAcu2xhaj3JUzs-McsC-suaHnFBo', BigInt),
        publicKey: {
          compression: 4n,
          x: decode('4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og', BigInt),
          y: decode('mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8', BigInt),
        },
      },
    },
  ],

  // Elliptic Curve SPKI Public Key.
  [
    '-----BEGIN PUBLIC KEY-----\n' +
      'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4c/cS6IT6jaVQeobt/6BDCTmzBaB\n' +
      'OTmmiSCpjd5a6Oiaes+cIVMOQZ0TCKVptqozsPPCUAWB61lOY/3Jwc/EXw==\n' +
      '-----END PUBLIC KEY-----',
    EcPublicSpki,
    {
      oid: {
        oid: '1.2.840.10045.2.1',
        curveOid: '1.2.840.10045.3.1.7',
      },
      publicKey: {
        compression: 4n,
        x: decode('4c_cS6IT6jaVQeobt_6BDCTmzBaBOTmmiSCpjd5a6Og', BigInt),
        y: decode('mnrPnCFTDkGdEwilabaqM7DzwlAFgetZTmP9ycHPxF8', BigInt),
      },
    },
  ],

  // RSA PKCS#1 Private Key.
  [
    '-----BEGIN RSA PRIVATE KEY-----\n' +
      'MIIEpAIBAAKCAQEAxjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4\n' +
      'uK1c4SzDt4YcurDByhgKNzeBo6Vq3IRrkrltp97LKWfeZdM+leGt8+UTZEWqrNf3\n' +
      'UGOEj8kI6lbjiG+Sn/yNHcVA9qBV22norZkgXctHLeFbY6TmpD+I8/UiplZUHoc9\n' +
      'KlYc7crCQRa+O7tKFDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0b\n' +
      'tMfA7RpUCWLT6TMRQPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzq\n' +
      'SBoxdeLWcNf/u20S5JG5iK0nsm1uZYu+02XN+wIDAQABAoIBAHHNmK1omvSxkWnd\n' +
      'EjHtD65Znnh0skXufrvvkCXD+Lhf+S2GM1yLIwyff4mIdEv2GHumy46hzkqeODh7\n' +
      'yaqFzF+Y9/hAipzY51BzLUQdmsFxgagToQfE6qEF4Jlw4tY8f+hbvMR/r2kn6cK7\n' +
      'DftEMyHGB4pem/IcBNH9K+orLQZi+4msiW5zjae52vaMNn1EJZ6+Nb7B2WuJJ02d\n' +
      'hNpKuZ7YGl5RegCHXOAw/wWaX9mpRG4UDF/U9evGbEsgLO8Cknd4r4R0UGslxGqV\n' +
      'H2f8pL5xePg6FSNYkaKMIGfnZZ7+BX92KykN2b97hyXBdQbVkFYqTiB8eBsiHOG5\n' +
      'k0gOTxECgYEA+ZFuDg38cG+e5L6h1Jbn8ngifWgHx8m1gybkY7yEpU1V02fvQAMI\n' +
      '1XG+1WpZm2xjj218wNCj0BCEdmdBqZMk5RlzLagtfzQ3rPO+ucYPZ/SDmy8Udzr+\n' +
      'sZLCqMFyLtxkgMfGo4QZ6UJWYpTCCmZ92nS/pa4ePrQdlpnS4DLv/SMCgYEAy1Yd\n' +
      'ZtsbYfCOdsYBZrDpcvubwMN2fKRAzETYW5sqYv8XkxHG1J1zHH+zWJBQfZhTbiHP\n' +
      'gHvoaFykEm9xhuA77RFGRXxFUrGBtfqIx/OG+kRWudmH83EyMzMoKQaW98RXWqRO\n' +
      '1JDlcs4/vzf/KN63zQKv5i4UdiiObQkZCYIOVUkCgYEAvqtDX+2DjgtZY/3Y+eiJ\n' +
      'MRBjmVgfiZ4r1RWjrCddWEVrauafPVKULy6F09s6tqnqrqvBgjZk0ROtgCCHZB0N\n' +
      'NRNqkdlJWUP1vWdDsf8FyjBfU/J2OlmSOOydV/zjVbX/+vumYUsN2M5b3Vk1nmiL\n' +
      'gplryhLq/JDzghnnqG6CN+0CgYEAtKczxBhSwbcpu5i70fLH1iJ5BNAkSyTbdSCN\n' +
      'YQYAqKee2Elo76lbhixmuP6upIdbSHO9mZd8qov0MXTV1lEOrNc2KbH5HTkb1wRZ\n' +
      '1dwlReDFdKUxxjYBtb9zpM93/XVxbtSgPPbnBBL+S/OCPVtyzS/f+49hGoF52KHG\n' +
      'ns3v0hECgYALir24iL7V9iETQ1NZU3N2FKLt8De7OdNZpbVfktYEXiAE5xa8wxN8\n' +
      '5kRo+O1jZY9dpNZTht1U3QaCS1UtQM8utKPnfdbVw5Blv+ab/sEU2uV56Wu5Pztt\n' +
      'mFY9hD3v2SXrn3TJKBsfzWkQzwVBbUkEBPPQxi1Q1kC3w3frS9rITg==\n' +
      '-----END RSA PRIVATE KEY-----',
    RsaPrivatePkcs1,
    {
      version: 0n,
      n: decode(
        'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
          'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
          'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
          'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
          'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
          '5JG5iK0nsm1uZYu-02XN-w',
        BigInt
      ),
      e: decode('AQAB', BigInt),
      d: decode(
        'cc2YrWia9LGRad0SMe0PrlmeeHSyRe5-u--QJcP4uF_5LYYzXIsjDJ9_iYh0S_YY' +
          'e6bLjqHOSp44OHvJqoXMX5j3-ECKnNjnUHMtRB2awXGBqBOhB8TqoQXgmXDi1jx_' +
          '6Fu8xH-vaSfpwrsN-0QzIcYHil6b8hwE0f0r6istBmL7iayJbnONp7na9ow2fUQl' +
          'nr41vsHZa4knTZ2E2kq5ntgaXlF6AIdc4DD_BZpf2alEbhQMX9T168ZsSyAs7wKS' +
          'd3ivhHRQayXEapUfZ_ykvnF4-DoVI1iRoowgZ-dlnv4Ff3YrKQ3Zv3uHJcF1BtWQ' +
          'VipOIHx4GyIc4bmTSA5PEQ',
        BigInt
      ),
      p: decode(
        '-ZFuDg38cG-e5L6h1Jbn8ngifWgHx8m1gybkY7yEpU1V02fvQAMI1XG-1WpZm2xj' +
          'j218wNCj0BCEdmdBqZMk5RlzLagtfzQ3rPO-ucYPZ_SDmy8Udzr-sZLCqMFyLtxk' +
          'gMfGo4QZ6UJWYpTCCmZ92nS_pa4ePrQdlpnS4DLv_SM',
        BigInt
      ),
      q: decode(
        'y1YdZtsbYfCOdsYBZrDpcvubwMN2fKRAzETYW5sqYv8XkxHG1J1zHH-zWJBQfZhT' +
          'biHPgHvoaFykEm9xhuA77RFGRXxFUrGBtfqIx_OG-kRWudmH83EyMzMoKQaW98RX' +
          'WqRO1JDlcs4_vzf_KN63zQKv5i4UdiiObQkZCYIOVUk',
        BigInt
      ),
      dp: decode(
        'vqtDX-2DjgtZY_3Y-eiJMRBjmVgfiZ4r1RWjrCddWEVrauafPVKULy6F09s6tqnq' +
          'rqvBgjZk0ROtgCCHZB0NNRNqkdlJWUP1vWdDsf8FyjBfU_J2OlmSOOydV_zjVbX_' +
          '-vumYUsN2M5b3Vk1nmiLgplryhLq_JDzghnnqG6CN-0',
        BigInt
      ),
      dq: decode(
        'tKczxBhSwbcpu5i70fLH1iJ5BNAkSyTbdSCNYQYAqKee2Elo76lbhixmuP6upIdb' +
          'SHO9mZd8qov0MXTV1lEOrNc2KbH5HTkb1wRZ1dwlReDFdKUxxjYBtb9zpM93_XVx' +
          'btSgPPbnBBL-S_OCPVtyzS_f-49hGoF52KHGns3v0hE',
        BigInt
      ),
      qi: decode(
        'C4q9uIi-1fYhE0NTWVNzdhSi7fA3uznTWaW1X5LWBF4gBOcWvMMTfOZEaPjtY2WP' +
          'XaTWU4bdVN0GgktVLUDPLrSj533W1cOQZb_mm_7BFNrleelruT87bZhWPYQ979kl' +
          '6590ySgbH81pEM8FQW1JBATz0MYtUNZAt8N360vayE4',
        BigInt
      ),
    },
  ],

  // RSA PKCS#8 Private Key.
  [
    '-----BEGIN PRIVATE KEY-----\n' +
      'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDGOkXJ3NNsHLMv\n' +
      'mOERrbJA7rd2lL131Ipo3XTsBHr2yQqJNHi4rVzhLMO3hhy6sMHKGAo3N4GjpWrc\n' +
      'hGuSuW2n3sspZ95l0z6V4a3z5RNkRaqs1/dQY4SPyQjqVuOIb5Kf/I0dxUD2oFXb\n' +
      'aeitmSBdy0ct4VtjpOakP4jz9SKmVlQehz0qVhztysJBFr47u0oUNQs1MyOOJ9zR\n' +
      '2a5g/tlxgBleZGag6lC4Ovyzs5ljtMCo3Ru0x8DtGlQJYtPpMxFA9fwZzJPF9uQ6\n' +
      'tJMW54owdU11cO2XTrxdcn2aSM5GISbCXOpIGjF14tZw1/+7bRLkkbmIrSeybW5l\n' +
      'i77TZc37AgMBAAECggEAcc2YrWia9LGRad0SMe0PrlmeeHSyRe5+u++QJcP4uF/5\n' +
      'LYYzXIsjDJ9/iYh0S/YYe6bLjqHOSp44OHvJqoXMX5j3+ECKnNjnUHMtRB2awXGB\n' +
      'qBOhB8TqoQXgmXDi1jx/6Fu8xH+vaSfpwrsN+0QzIcYHil6b8hwE0f0r6istBmL7\n' +
      'iayJbnONp7na9ow2fUQlnr41vsHZa4knTZ2E2kq5ntgaXlF6AIdc4DD/BZpf2alE\n' +
      'bhQMX9T168ZsSyAs7wKSd3ivhHRQayXEapUfZ/ykvnF4+DoVI1iRoowgZ+dlnv4F\n' +
      'f3YrKQ3Zv3uHJcF1BtWQVipOIHx4GyIc4bmTSA5PEQKBgQD5kW4ODfxwb57kvqHU\n' +
      'lufyeCJ9aAfHybWDJuRjvISlTVXTZ+9AAwjVcb7ValmbbGOPbXzA0KPQEIR2Z0Gp\n' +
      'kyTlGXMtqC1/NDes8765xg9n9IObLxR3Ov6xksKowXIu3GSAx8ajhBnpQlZilMIK\n' +
      'Zn3adL+lrh4+tB2WmdLgMu/9IwKBgQDLVh1m2xth8I52xgFmsOly+5vAw3Z8pEDM\n' +
      'RNhbmypi/xeTEcbUnXMcf7NYkFB9mFNuIc+Ae+hoXKQSb3GG4DvtEUZFfEVSsYG1\n' +
      '+ojH84b6RFa52YfzcTIzMygpBpb3xFdapE7UkOVyzj+/N/8o3rfNAq/mLhR2KI5t\n' +
      'CRkJgg5VSQKBgQC+q0Nf7YOOC1lj/dj56IkxEGOZWB+JnivVFaOsJ11YRWtq5p89\n' +
      'UpQvLoXT2zq2qequq8GCNmTRE62AIIdkHQ01E2qR2UlZQ/W9Z0Ox/wXKMF9T8nY6\n' +
      'WZI47J1X/ONVtf/6+6ZhSw3YzlvdWTWeaIuCmWvKEur8kPOCGeeoboI37QKBgQC0\n' +
      'pzPEGFLBtym7mLvR8sfWInkE0CRLJNt1II1hBgCop57YSWjvqVuGLGa4/q6kh1tI\n' +
      'c72Zl3yqi/QxdNXWUQ6s1zYpsfkdORvXBFnV3CVF4MV0pTHGNgG1v3Okz3f9dXFu\n' +
      '1KA89ucEEv5L84I9W3LNL9/7j2EagXnYocaeze/SEQKBgAuKvbiIvtX2IRNDU1lT\n' +
      'c3YUou3wN7s501mltV+S1gReIATnFrzDE3zmRGj47WNlj12k1lOG3VTdBoJLVS1A\n' +
      'zy60o+d91tXDkGW/5pv+wRTa5Xnpa7k/O22YVj2EPe/ZJeufdMkoGx/NaRDPBUFt\n' +
      'SQQE89DGLVDWQLfDd+tL2shO\n' +
      '-----END PRIVATE KEY-----',
    RsaPrivatePkcs8,
    {
      version: 0n,
      oid: {
        oid: '1.2.840.113549.1.1.1',
        nil: null,
      },
      privateKey: {
        version: 0n,
        n: decode(
          'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
            'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
            'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
            'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
            'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
            '5JG5iK0nsm1uZYu-02XN-w',
          BigInt
        ),
        e: decode('AQAB', BigInt),
        d: decode(
          'cc2YrWia9LGRad0SMe0PrlmeeHSyRe5-u--QJcP4uF_5LYYzXIsjDJ9_iYh0S_YY' +
            'e6bLjqHOSp44OHvJqoXMX5j3-ECKnNjnUHMtRB2awXGBqBOhB8TqoQXgmXDi1jx_' +
            '6Fu8xH-vaSfpwrsN-0QzIcYHil6b8hwE0f0r6istBmL7iayJbnONp7na9ow2fUQl' +
            'nr41vsHZa4knTZ2E2kq5ntgaXlF6AIdc4DD_BZpf2alEbhQMX9T168ZsSyAs7wKS' +
            'd3ivhHRQayXEapUfZ_ykvnF4-DoVI1iRoowgZ-dlnv4Ff3YrKQ3Zv3uHJcF1BtWQ' +
            'VipOIHx4GyIc4bmTSA5PEQ',
          BigInt
        ),
        p: decode(
          '-ZFuDg38cG-e5L6h1Jbn8ngifWgHx8m1gybkY7yEpU1V02fvQAMI1XG-1WpZm2xj' +
            'j218wNCj0BCEdmdBqZMk5RlzLagtfzQ3rPO-ucYPZ_SDmy8Udzr-sZLCqMFyLtxk' +
            'gMfGo4QZ6UJWYpTCCmZ92nS_pa4ePrQdlpnS4DLv_SM',
          BigInt
        ),
        q: decode(
          'y1YdZtsbYfCOdsYBZrDpcvubwMN2fKRAzETYW5sqYv8XkxHG1J1zHH-zWJBQfZhT' +
            'biHPgHvoaFykEm9xhuA77RFGRXxFUrGBtfqIx_OG-kRWudmH83EyMzMoKQaW98RX' +
            'WqRO1JDlcs4_vzf_KN63zQKv5i4UdiiObQkZCYIOVUk',
          BigInt
        ),
        dp: decode(
          'vqtDX-2DjgtZY_3Y-eiJMRBjmVgfiZ4r1RWjrCddWEVrauafPVKULy6F09s6tqnq' +
            'rqvBgjZk0ROtgCCHZB0NNRNqkdlJWUP1vWdDsf8FyjBfU_J2OlmSOOydV_zjVbX_' +
            '-vumYUsN2M5b3Vk1nmiLgplryhLq_JDzghnnqG6CN-0',
          BigInt
        ),
        dq: decode(
          'tKczxBhSwbcpu5i70fLH1iJ5BNAkSyTbdSCNYQYAqKee2Elo76lbhixmuP6upIdb' +
            'SHO9mZd8qov0MXTV1lEOrNc2KbH5HTkb1wRZ1dwlReDFdKUxxjYBtb9zpM93_XVx' +
            'btSgPPbnBBL-S_OCPVtyzS_f-49hGoF52KHGns3v0hE',
          BigInt
        ),
        qi: decode(
          'C4q9uIi-1fYhE0NTWVNzdhSi7fA3uznTWaW1X5LWBF4gBOcWvMMTfOZEaPjtY2WP' +
            'XaTWU4bdVN0GgktVLUDPLrSj533W1cOQZb_mm_7BFNrleelruT87bZhWPYQ979kl' +
            '6590ySgbH81pEM8FQW1JBATz0MYtUNZAt8N360vayE4',
          BigInt
        ),
      },
    },
  ],

  // RSA PKCS#1 Public Key.
  [
    '-----BEGIN RSA PUBLIC KEY-----\n' +
      'MIIBCgKCAQEAxjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c\n' +
      '4SzDt4YcurDByhgKNzeBo6Vq3IRrkrltp97LKWfeZdM+leGt8+UTZEWqrNf3UGOE\n' +
      'j8kI6lbjiG+Sn/yNHcVA9qBV22norZkgXctHLeFbY6TmpD+I8/UiplZUHoc9KlYc\n' +
      '7crCQRa+O7tKFDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA\n' +
      '7RpUCWLT6TMRQPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBox\n' +
      'deLWcNf/u20S5JG5iK0nsm1uZYu+02XN+wIDAQAB\n' +
      '-----END RSA PUBLIC KEY-----',
    RsaPublicPkcs1,
    {
      n: decode(
        'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
          'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
          'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
          'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
          'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
          '5JG5iK0nsm1uZYu-02XN-w',
        BigInt
      ),
      e: decode('AQAB', BigInt),
    },
  ],

  // RSA SPKI Public Key.
  [
    '-----BEGIN PUBLIC KEY-----\n' +
      'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxjpFydzTbByzL5jhEa2y\n' +
      'QO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDByhgKNzeBo6Vq3IRrkrlt\n' +
      'p97LKWfeZdM+leGt8+UTZEWqrNf3UGOEj8kI6lbjiG+Sn/yNHcVA9qBV22norZkg\n' +
      'XctHLeFbY6TmpD+I8/UiplZUHoc9KlYc7crCQRa+O7tKFDULNTMjjifc0dmuYP7Z\n' +
      'cYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMRQPX8GcyTxfbkOrSTFueK\n' +
      'MHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf/u20S5JG5iK0nsm1uZYu+02XN\n' +
      '+wIDAQAB\n' +
      '-----END PUBLIC KEY-----',
    RsaPublicSpki,
    {
      oid: {
        oid: '1.2.840.113549.1.1.1',
        nil: null,
      },
      publicKey: {
        n: decode(
          'xjpFydzTbByzL5jhEa2yQO63dpS9d9SKaN107AR69skKiTR4uK1c4SzDt4YcurDB' +
            'yhgKNzeBo6Vq3IRrkrltp97LKWfeZdM-leGt8-UTZEWqrNf3UGOEj8kI6lbjiG-S' +
            'n_yNHcVA9qBV22norZkgXctHLeFbY6TmpD-I8_UiplZUHoc9KlYc7crCQRa-O7tK' +
            'FDULNTMjjifc0dmuYP7ZcYAZXmRmoOpQuDr8s7OZY7TAqN0btMfA7RpUCWLT6TMR' +
            'QPX8GcyTxfbkOrSTFueKMHVNdXDtl068XXJ9mkjORiEmwlzqSBoxdeLWcNf_u20S' +
            '5JG5iK0nsm1uZYu-02XN-w',
          BigInt
        ),
        e: decode('AQAB', BigInt),
      },
    },
  ],
];

describe('DerDecoder', () => {
  it.each(pemToModel)('should decode the provided PEM into the provided Model.', (pem, Model, expected) => {
    const decoder = new DerDecoder(fromPEM(pem), Model);
    expect(decoder.decode()).toMatchObject(expected);
  });
});
