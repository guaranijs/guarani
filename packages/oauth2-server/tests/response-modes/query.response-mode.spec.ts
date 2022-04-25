import { Response } from '../../lib/http/response';
import { QueryResponseMode } from '../../lib/response-modes/query.response-mode';
import { SupportedResponseMode } from '../../lib/response-modes/types/supported-response-mode';

describe('Query Response Mode', () => {
  it('should have "query" as its name.', () => {
    expect(new QueryResponseMode().name).toBe<SupportedResponseMode>('query');
  });

  it('should create a Redirect HTTP Response with a populated URI Query.', () => {
    expect(new QueryResponseMode().createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar' })).toMatchObject<
      Partial<Response>
    >({
      statusCode: 302,
      headers: { Location: 'https://example.com/?foo=foo&bar=bar' },
      body: Buffer.alloc(0),
    });
  });
});
