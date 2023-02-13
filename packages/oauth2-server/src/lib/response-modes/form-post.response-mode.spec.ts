import { DependencyInjectionContainer } from '@guarani/di';

import { Buffer } from 'buffer';

import { HttpResponse } from '../http/http.response';
import { FormPostResponseMode } from './form-post.response-mode';

const body = `<!DOCTYPE html>
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
</html>`;

describe('Form Post Response Mode', () => {
  let responseMode: FormPostResponseMode;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(FormPostResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(FormPostResponseMode);
  });

  it('should have "form_post" as its name.', () => {
    expect(responseMode.name).toBe('form_post');
  });

  it('should create a http response with a populated html body.', () => {
    expect(
      responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
    ).toMatchObject<Partial<HttpResponse>>({
      body: Buffer.from(body, 'utf8'),
      statusCode: 200,
    });
  });
});
