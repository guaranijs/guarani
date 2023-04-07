import { DependencyInjectionContainer } from '@guarani/di';

import { HttpResponse } from '../http/http.response';
import { FragmentResponseMode } from './fragment.response-mode';
import { ResponseMode } from './response-mode.type';

describe('Fragment Response Mode', () => {
  let responseMode: FragmentResponseMode;

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind(FragmentResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(FragmentResponseMode);
  });

  it('should have "fragment" as its name.', () => {
    expect(responseMode.name).toEqual<ResponseMode>('fragment');
  });

  it('should create a redirect http response with a populated uri fragment.', () => {
    expect(
      responseMode.createHttpResponse('https://example.com', { foo: 'foo', bar: 'bar', baz: 'baz' })
    ).toStrictEqual(new HttpResponse().redirect('https://example.com/#foo=foo&bar=bar&baz=baz'));
  });
});
