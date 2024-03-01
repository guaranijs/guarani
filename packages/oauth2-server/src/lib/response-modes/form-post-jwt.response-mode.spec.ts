import { Buffer } from 'buffer';
import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { AuthorizationResponseTokenHandler } from '../handlers/authorization-response-token.handler';
import { Logger } from '../logger/logger';
import { FormPostJwtResponseMode } from './form-post-jwt.response-mode';
import { ResponseMode } from './response-mode.type';

jest.mock('../handlers/authorization-response-token.handler');
jest.mock('../logger/logger');

const body = `
<!DOCTYPE html>
<html>
<head>
  <title>Authorizing...</title>
</head>
<body onload="document.forms[0].submit();">
  <form method="POST" action="https:&#x2F;&#x2F;example.com&#x2F;">
    <input type="hidden" name="response" value="authorization_response_token" />
    <noscript>
      <p>Your browser does not support javascript or it is disabled.</p>
      <button autofocus type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>
`;

describe('Form Post JSON Web Token Response Mode', () => {
  let container: DependencyInjectionContainer;
  let responseMode: FormPostJwtResponseMode;

  const loggerMock = jest.mocked(Logger.prototype);
  const authorizationResponseTokenHandlerMock = jest.mocked(AuthorizationResponseTokenHandler.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind(AuthorizationResponseTokenHandler).toValue(authorizationResponseTokenHandlerMock);
    container.bind(FormPostJwtResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(FormPostJwtResponseMode);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "form_post.jwt" as its value.', () => {
      expect(responseMode.name).toEqual<ResponseMode>('form_post.jwt');
    });
  });

  describe('createHttpResponse()', () => {
    const context = <AuthorizationContext>{
      redirectUri: new URL('https://example.com'),
    };

    it('should create a http response with a populated html body.', async () => {
      authorizationResponseTokenHandlerMock.generateAuthorizationResponseToken.mockResolvedValueOnce(
        'authorization_response_token',
      );

      const response = await responseMode.createHttpResponse(context, {
        var1: 'string',
        var2: 123,
        var3: true,
        var4: null,
        var5: undefined,
      });

      console.log(response.body.toString('utf8'));

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ 'Content-Type': 'text/html; charset=UTF-8' });
      expect(response.body).toEqual(Buffer.from(body.trim(), 'utf8'));
    });
  });
});
