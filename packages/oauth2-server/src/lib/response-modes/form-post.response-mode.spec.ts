import { Buffer } from 'buffer';
import { OutgoingHttpHeaders } from 'http';
import { URL } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { FormPostResponseMode } from './form-post.response-mode';
import { ResponseMode } from './response-mode.type';

const body = `
<!DOCTYPE html>
<html>
<head>
  <title>Authorizing...</title>
</head>
<body onload="document.forms[0].submit();">
  <form method="POST" action="https:&#x2F;&#x2F;example.com&#x2F;">
    <input type="hidden" name="var1" value="string" />
    <input type="hidden" name="var2" value="123" />
    <input type="hidden" name="var3" value="true" />
    <noscript>
      <p>Your browser does not support javascript or it is disabled.</p>
      <button autofocus type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>
`;

describe('Form Post Response Mode', () => {
  let container: DependencyInjectionContainer;
  let responseMode: FormPostResponseMode;

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(FormPostResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(FormPostResponseMode);
  });

  describe('name', () => {
    it('should have "form_post" as its value.', () => {
      expect(responseMode.name).toEqual<ResponseMode>('form_post');
    });
  });

  describe('createHttpResponse()', () => {
    const context = <AuthorizationContext>{
      redirectUri: new URL('https://example.com'),
    };

    it('should create a http response with a populated html body.', async () => {
      const response = await responseMode.createHttpResponse(context, {
        var1: 'string',
        var2: 123,
        var3: true,
        var4: null,
        var5: undefined,
      });

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ 'Content-Type': 'text/html; charset=UTF-8' });
      expect(response.body).toEqual(Buffer.from(body.trim(), 'utf8'));
    });
  });
});
