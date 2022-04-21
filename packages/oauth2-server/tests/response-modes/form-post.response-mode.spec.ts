import { Response } from '../../lib/http/response';
import { FormPostResponseMode } from '../../lib/response-modes/form-post.response-mode';
import { SupportedResponseMode } from '../../lib/response-modes/types/supported-response-mode';

const body = `<!DOCTYPE html>
<html>
<head>
  <title>Authorizing...</title>
</head>
<body onload="document.forms[0].submit();">
  <form method="POST" action="https:&#x2F;&#x2F;example.com">
    <input type="hidden" name="foo" value="foo" />
    <input type="hidden" name="bar" value="bar" />
    <noscript>
      <p>Your browser does not support javascript or it is disabled.</p>
      <button autofocus type="submit">Continue</button>
    </noscript>
  </form>
</body>
</html>`;

describe('Form Post Response Mode', () => {
  it('should have "form_post" as its name.', () => {
    expect(new FormPostResponseMode().name).toBe<SupportedResponseMode>('form_post');
  });

  it('should create a HTTP Response with a populated HTML Body.', () => {
    expect(
      new FormPostResponseMode().createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar' })
    ).toMatchObject<Partial<Response>>({
      statusCode: 200,
      body: Buffer.from(body, 'utf8'),
    });
  });
});
