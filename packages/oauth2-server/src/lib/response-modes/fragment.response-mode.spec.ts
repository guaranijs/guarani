import { OutgoingHttpHeaders } from 'http';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { FragmentResponseMode } from './fragment.response-mode';
import { ResponseMode } from './response-mode.type';

describe('Fragment Response Mode', () => {
  let container: DependencyInjectionContainer;
  let responseMode: FragmentResponseMode;

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(FragmentResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(FragmentResponseMode);
  });

  describe('name', () => {
    it('should have "fragment" as its value.', () => {
      expect(responseMode.name).toEqual<ResponseMode>('fragment');
    });
  });

  describe('createHttpResponse()', () => {
    it('should create a redirect http response with a populated uri fragment.', () => {
      const response = responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/#foo=foo&bar=bar&baz=baz',
      });
    });
  });
});
