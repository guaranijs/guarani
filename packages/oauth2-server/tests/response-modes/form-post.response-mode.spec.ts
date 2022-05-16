import { Attributes } from '@guarani/types';

import { HttpResponse } from '../../lib/http/http.response';
import { FormPostResponseMode } from '../../lib/response-modes/form-post.response-mode';
import { ResponseMode } from '../../lib/types/response-mode';

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

const responseMode = new FormPostResponseMode();

describe('Form Post Response Mode', () => {
  it('should have "form_post" as its name.', () => {
    expect(responseMode.name).toBe<ResponseMode>('form_post');
  });

  it('should create a http response with a populated html body.', () => {
    expect(
      responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
    ).toMatchObject<Attributes<HttpResponse>>({
      body: Buffer.from(body, 'utf8'),
      headers: {},
      statusCode: 200,
    });
  });
});
