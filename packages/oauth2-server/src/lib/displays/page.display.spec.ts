import { DependencyInjectionContainer } from '@guarani/di';
import { HttpResponse } from '../http/http.response';
import { Display } from './display.type';
import { PageDisplay } from './page.display';

describe('Page Display', () => {
  let display: PageDisplay;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

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
      expect(display.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })).toStrictEqual(
        new HttpResponse().redirect('https://example.com/?foo=foo&bar=bar&baz=baz')
      );
    });
  });
});
