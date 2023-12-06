import { JsonWebKeyParameters } from '../jsonwebkey.parameters';
import { JsonWebKeyBackend } from './jsonwebkey.backend';

const backend: JsonWebKeyBackend = Reflect.construct(JsonWebKeyBackend, []);

describe('JSON Web Key Backend', () => {
  describe('thumbprint', () => {
    it('should return the sha-256 thumbprint of a json web key.', () => {
      const parameters: JsonWebKeyParameters = {
        e: 'AQAB',
        kty: 'RSA',
        n:
          '0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2aiAFbWhM78LhWx4cbbfAAtVT86z' +
          'wu1RK7aPFFxuhDR1L6tSoc_BJECPebWKRXjBZCiFV4n3oknjhMstn64tZ_2W-5Js' +
          'GY4Hc5n9yBXArwl93lqt7_RN5w6Cf0h4QyQ5v-65YGjQR0_FDW2QvzqY368QQMic' +
          'AtaSqzs8KJZgnYb9c7d0zgdAZHzu6qMQvRL5hajrn1n91CbOpbISD08qNLyrdkt-' +
          'bFTWhAI4vMQFh6WeZu0fM4lFd2NcRwr3XPksINHaQ-G_xBniIqbw0Ls1jF44-csF' +
          'Cur-kEgU8awapJzKnqDKgw',
      };

      Reflect.set(backend, 'getThumbprintParameters', () => parameters);

      expect(backend.getThumbprint(parameters).toString('base64url')).toEqual(
        'NzbLsXh8uDCcd-6MNwXF4W_7noWXFZAfHkxZsRGC9Xs',
      );

      Reflect.deleteProperty(backend, 'getThumbprintParameters');
    });
  });
});
