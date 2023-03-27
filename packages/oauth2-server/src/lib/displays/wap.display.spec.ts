import { DependencyInjectionContainer } from '@guarani/di';

import { HttpResponse } from '../http/http.response';
import { Display } from './display.type';
import { WapDisplay } from './wap.display';

describe('Wap Display', () => {
  let display: WapDisplay;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(WapDisplay).toSelf().asSingleton();

    display = container.resolve(WapDisplay);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "wap" as its value.', () => {
      expect(display.name).toEqual<Display>('wap');
    });
  });

  describe('createHttpResponse()', () => {
    it('should create a redirect http response with a populated uri query.', () => {
      expect(display.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })).toMatchObject<
        Partial<HttpResponse>
      >({
        body: Buffer.alloc(0),
        headers: { Location: 'https://example.com/?foo=foo&bar=bar&baz=baz' },
        statusCode: 303,
      });
    });
  });
});
