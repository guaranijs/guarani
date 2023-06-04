import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { OutgoingHttpHeaders } from 'http';

import { Display } from './display.type';
import { TouchDisplay } from './touch.display';

describe('Touch Display', () => {
  let container: DependencyInjectionContainer;
  let display: TouchDisplay;

  beforeEach(() => {
    container = new DependencyInjectionContainer();

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
      const response = display.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?foo=foo&bar=bar&baz=baz',
      });
    });
  });
});
