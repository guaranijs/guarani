import { OutgoingHttpHeaders } from 'http';

import { DependencyInjectionContainer } from '@guarani/di';
import { Dictionary } from '@guarani/types';

import { AuthorizationContext } from '../context/authorization/authorization-context';
import { HttpResponse } from '../http/http.response';
import { ResponseTypeInterface } from '../response-types/response-type.interface';
import { JwtResponseMode } from './jwt.response-mode';
import { ResponseModeInterface } from './response-mode.interface';
import { RESPONSE_MODE } from './response-mode.token';
import { ResponseMode } from './response-mode.type';

describe('JSON Web Token Response Mode', () => {
  let container: DependencyInjectionContainer;
  let responseMode: JwtResponseMode;

  const responseModesMocks = [
    jest.mocked<ResponseModeInterface>({ name: 'query', createHttpResponse: jest.fn() }),
    jest.mocked<ResponseModeInterface>({ name: 'query.jwt', createHttpResponse: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    responseModesMocks.forEach((responseModeMock) =>
      container.bind<ResponseModeInterface>(RESPONSE_MODE).toValue(responseModeMock),
    );

    container.bind(DependencyInjectionContainer).toValue(container);
    container.bind(JwtResponseMode).toSelf().asSingleton();

    responseMode = container.resolve(JwtResponseMode);
  });

  describe('name', () => {
    it('should have "jwt" as its value.', () => {
      expect(responseMode.name).toEqual<ResponseMode>('jwt');
    });
  });

  describe('createHttpResponse()', () => {
    it('should delegate the result to another response mode.', async () => {
      const responseType = jest.mocked<ResponseTypeInterface>({
        name: 'code',
        defaultResponseMode: 'query',
        handle: jest.fn(),
      });

      const context = <AuthorizationContext>{ responseType: responseType as ResponseTypeInterface };

      responseModesMocks[1]!.createHttpResponse.mockResolvedValueOnce(
        new HttpResponse().redirect('https://example.com/?response=authorization_response_token'),
      );

      const response = await responseMode.createHttpResponse(context, {
        code: 'authorization_code',
        state: 'client_state',
      });

      expect(response.statusCode).toEqual(303);
      expect(response.cookies).toStrictEqual<Dictionary<unknown>>({});
      expect(response.headers).toStrictEqual<OutgoingHttpHeaders>({
        Location: 'https://example.com/?response=authorization_response_token',
      });
    });
  });
});
