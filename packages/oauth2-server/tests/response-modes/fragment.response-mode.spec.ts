import { FragmentResponseMode } from '../../lib/response-modes/fragment.response-mode';
import { SupportedResponseMode } from '../../lib/response-modes/types/supported-response-mode';

describe('Fragment Response Mode', () => {
  it('should have "fragment" as its name.', () => {
    expect(new FragmentResponseMode().name).toBe<SupportedResponseMode>('fragment');
  });

  it('should create a Redirect HTTP Response with a populated URI Fragment.', () => {
    expect(
      new FragmentResponseMode().createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar' })
    ).toMatchObject({
      statusCode: 303,
      headers: { Location: 'https://example.com/#foo=foo&bar=bar' },
    });
  });
});
