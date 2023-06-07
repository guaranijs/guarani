import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { OutgoingHttpHeaders } from 'http';

import { Display } from './display.type';
import { PageDisplay } from './page.display';

describe('Page Display', () => {
  let container: DependencyInjectionContainer;
  let display: PageDisplay;

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(PageDisplay).toSelf().asSingleton();

    display = container.resolve(PageDisplay);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "page" as its value.', () => {
      expect(display.name).toEqual<Display>('page');
    });
  });

  describe('createHttpResponse()', () => {
    it('should create a redirect http response with a populated uri query.', () => {
      const response = display.createHttpResponse('https://example.com', {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz',
        empty: null,
      });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?foo=foo&bar=bar&baz=baz',
      });
    });

    it('should create a redirect http response with a populated uri query preserving the previous parameters.', () => {
      const response = display.createHttpResponse('https://example.com/?tenant=tenant_id', {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz',
        empty: null,
      });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?tenant=tenant_id&foo=foo&bar=bar&baz=baz',
      });
    });
  });
});
