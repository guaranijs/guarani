import { Response } from '../../lib/http/response';

describe('Response', () => {
  it('should create an empty Response.', () => {
    expect(new Response()).toMatchObject({
      statusCode: 200,
      headers: {},
      body: Buffer.alloc(0),
    });
  });

  it('should create a JSON Response.', () => {
    expect(new Response().json({ foo: 'foo' })).toMatchObject({
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify({ foo: 'foo' }), 'utf8'),
    });
  });

  it('should create a Redirect Response.', () => {
    expect(new Response().redirect('https://example.com')).toMatchObject({
      statusCode: 303,
      headers: { Location: 'https://example.com' },
      body: Buffer.alloc(0),
    });
  });

  it('should create an HTML Response.', () => {
    expect(new Response().html('<html></html>').setHeader('X-Session', 'sessionid').status(201)).toMatchObject({
      statusCode: 201,
      headers: { 'Content-Type': 'text/html; charset=UTF-8', 'X-Session': 'sessionid' },
      body: Buffer.from('<html></html>', 'utf8'),
    });
  });
});
