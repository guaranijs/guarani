import { Buffer } from 'buffer';
import { OutgoingHttpHeaders } from 'http';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { FormPostResponseMode } from './form-post.response-mode';
import { ResponseMode } from './response-mode.type';

const body = `
<!DOCTYPE html>
<html>
<head>
  <title>Authorizing...</title>
</head>
<body onload="document.forms[0].submit();">
  <form method="POST" action="https:&#x2F;&#x2F;example.com">
    <input type="hidden" name="foo" value="foo" />
    <input type="hidden" name="bar" value="bar" />
    <input type="hidden" name="baz" value="baz" />
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
    it('should create a http response with a populated html body.', () => {
      const response = responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' });

      expect(response.statusCode).toEqual(200);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({ 'Content-Type': 'text/html; charset=UTF-8' });
      expect(response.body).toEqual(Buffer.from(body.trim(), 'utf8'));
    });
  });
});
