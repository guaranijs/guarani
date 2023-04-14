import { DependencyInjectionContainer } from '@guarani/di';

import { HttpResponse } from '../http/http.response';
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
      expect(
        responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
      ).toStrictEqual(new HttpResponse().redirect('https://example.com/#foo=foo&bar=bar&baz=baz'));
    });
  });
});
