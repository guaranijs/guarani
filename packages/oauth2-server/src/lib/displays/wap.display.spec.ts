import { DependencyInjectionContainer } from '@guarani/di';

import { HttpResponse } from '../http/http.response';
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
      expect(display.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })).toStrictEqual(
        new HttpResponse().redirect('https://example.com/?foo=foo&bar=bar&baz=baz')
      );
    });
  });
});
