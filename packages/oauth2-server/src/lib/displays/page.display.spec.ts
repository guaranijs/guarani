import { OutgoingHttpHeaders } from 'http';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { Logger } from '../logger/logger';
import { Display } from './display.type';
import { PageDisplay } from './page.display';

jest.mock('../logger/logger');

describe('Page Display', () => {
  let container: DependencyInjectionContainer;
  let display: PageDisplay;

  const loggerMock = jest.mocked(Logger.prototype);

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
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
        var1: 'string',
        var2: 123,
        var3: true,
        var4: null,
        var5: undefined,
      });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?var1=string&var2=123&var3=true',
      });
    });

    it('should create a redirect http response with a populated uri query preserving the previous parameters.', () => {
      const response = display.createHttpResponse('https://example.com/?tenant=tenant_id', {
        var1: 'string',
        var2: 123,
        var3: true,
        var4: null,
        var5: undefined,
      });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?tenant=tenant_id&var1=string&var2=123&var3=true',
      });
    });
  });
});
