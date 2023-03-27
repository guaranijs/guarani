import { DependencyInjectionContainer } from '@guarani/di';

import { HttpResponse } from '../http/http.response';
import { Display } from './display.type';
import { TouchDisplay } from './touch.display';

describe('Touch Display', () => {
  let display: TouchDisplay;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(TouchDisplay).toSelf().asSingleton();

    display = container.resolve(TouchDisplay);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "touch" as its value.', () => {
      expect(display.name).toEqual<Display>('touch');
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
