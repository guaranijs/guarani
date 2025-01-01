import { DependencyInjectionContainer } from '@guarani/di';
import { JSON } from '@guarani/primitives';

import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { Logger } from '../logger/logger';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { AuthorizationRequestClaimsParameter } from '../types/authorization-request-claims-parameter.type';
import { ClaimsHandler } from './claims.handler';

jest.mock('../logger/logger');

describe('Claims Handler', () => {
  let container: DependencyInjectionContainer;
  let handler: ClaimsHandler;

  const loggerMock = jest.mocked(Logger.prototype);

  const settings = <Settings>{ enableClaimsAuthorizationRequestParameter: true };

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind(Logger).toValue(loggerMock);
    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind(ClaimsHandler).toSelf().asSingleton();

    handler = container.resolve(ClaimsHandler);
  });

  describe('checkRequestedClaims()', () => {
    it('should throw when the authorization server does not support the usage of the "claims" authorization request parameter.', () => {
      const settings = <Settings>{ enableClaimsAuthorizationRequestParameter: false };

      container.delete<Settings>(SETTINGS);
      container.delete(ClaimsHandler);

      container.bind<Settings>(SETTINGS).toValue(settings);
      container.bind(ClaimsHandler).toSelf().asSingleton();

      handler = container.resolve(ClaimsHandler);

      expect(() => handler.checkRequestedClaims('')).toThrowWithMessage(
        InvalidRequestException,
        'The Authorization Server does not support the "claims" Authorization Parameter.',
      );
    });

    it('should throw when the provided "claims" parameter is invalid.', async () => {
      expect(() => handler.checkRequestedClaims('{"invalid_json":}')).toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "claims".',
      );
    });

    it('should throw when the provided "claims" parameter is not a valid json object.', async () => {
      expect(() => handler.checkRequestedClaims('null')).toThrowWithMessage(
        InvalidRequestException,
        'The "claims" parameter is not a valid JSON object.',
      );
    });

    it('should throw when a top-level "claims" is not a valid json object.', async () => {
      expect(() => handler.checkRequestedClaims(JSON.stringify({ userinfo: null }))).toThrowWithMessage(
        InvalidRequestException,
        'The top-level claim "userinfo" is not a valid JSON object.',
      );
    });

    it('should throw when the options of a claim is not a valid json object.', async () => {
      expect(() =>
        handler.checkRequestedClaims(JSON.stringify({ userinfo: { email: 'invalid_claim_options' } })),
      ).toThrowWithMessage(
        InvalidRequestException,
        'The options for the claim "userinfo.email" is not a valid JSON object.',
      );
    });

    it('should throw when a claim has both the "value" and "values" options.', async () => {
      expect(() =>
        handler.checkRequestedClaims(
          JSON.stringify({
            userinfo: { email: { value: 'abc@email.com', values: ['abc@email.com', 'xyz@email.com'] } },
          }),
        ),
      ).toThrowWithMessage(
        InvalidRequestException,
        'Cannot have both "value" and "values" options for the claim "userinfo.email".',
      );
    });

    it('should throw when the "values" option of a claim is not an array.', async () => {
      expect(() =>
        handler.checkRequestedClaims(JSON.stringify({ userinfo: { email: { values: 'abc@email.com' } } })),
      ).toThrowWithMessage(
        InvalidRequestException,
        'The "values" option for the claim "userinfo.email" must be an array.',
      );
    });

    it('should return the parsed claims requested by the client.', () => {
      const claims: AuthorizationRequestClaimsParameter = {
        userinfo: {
          null_option: null,
          essential_option: { essential: true },
          value_option: { value: 'value' },
          values_option: { values: ['value_0', 'value_1'] },
          essential_value_option: { essential: true, value: 'essential_value' },
          essential_values_option: { essential: true, values: ['essential_value_0', 'essential_value_1'] },
        },
      };

      const parsedClaims = handler.checkRequestedClaims(JSON.stringify(claims));

      expect(parsedClaims).toStrictEqual(claims);
    });
  });
});
