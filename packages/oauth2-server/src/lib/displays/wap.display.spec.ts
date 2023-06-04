import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { OutgoingHttpHeaders } from 'http';

import { Display } from './display.type';
import { WapDisplay } from './wap.display';

describe('Wap Display', () => {
  let container: DependencyInjectionContainer;
  let display: WapDisplay;

  beforeEach(() => {
    container = new DependencyInjectionContainer();

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
      const response = display.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?foo=foo&bar=bar&baz=baz',
      });
    });
  });
});
