import { DependencyInjectionContainer } from '@guarani/di';

import { URLSearchParams } from 'url';

import { Client } from '../entities/client.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { AccessDeniedException } from '../exceptions/access-denied.exception';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { AuthorizationRequest } from '../messages/authorization-request';
import { LoginContextInteractionRequest } from '../messages/login-context.interaction-request';
import { LoginContextInteractionResponse } from '../messages/login-context.interaction-response';
import { LoginDecisionInteractionRequest } from '../messages/login-decision.interaction-request';
import { LoginDecisionInteractionResponse } from '../messages/login-decision.interaction-response';
import { SessionServiceInterface } from '../services/session.service.interface';
import { SESSION_SERVICE } from '../services/session.service.token';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { InteractionType } from './interaction-type.type';
import { LoginDecision } from './login-decision.type';
import { LoginInteractionType } from './login.interaction-type';

describe('Login Interaction Type', () => {
  let interactionType: LoginInteractionType;

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const userServiceMock = jest.mocked<UserServiceInterface>({
    findOne: jest.fn(),
  });

  const settings = <Settings>{ issuer: 'https://server.example.com' };

  beforeEach(() => {
    const container = new DependencyInjectionContainer();

    container.bind<Settings>(SETTINGS).toValue(settings);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);
    container.bind<UserServiceInterface>(USER_SERVICE).toValue(userServiceMock);
    container.bind(LoginInteractionType).toSelf().asSingleton();

    interactionType = container.resolve(LoginInteractionType);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "login" as its name.', () => {
      expect(interactionType.name).toEqual<InteractionType>('login');
    });
  });

  describe('handleContext()', () => {
    let parameters: LoginContextInteractionRequest;

    beforeEach(() => {
      parameters = { interaction_type: 'login', login_challenge: 'login_challenge' };
    });

    it('should throw when the parameter "login_challenge" is not provided.', async () => {
      Reflect.deleteProperty(parameters, 'login_challenge');

      await expect(interactionType.handleContext(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "login_challenge".' })
      );
    });

    it('should throw when no session is found.', async () => {
      sessionServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(interactionType.handleContext(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Session.' })
      );
    });

    it('should throw when the session is expired.', async () => {
      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        expiresAt: new Date(Date.now() - 3600000),
      });

      await expect(interactionType.handleContext(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Expired Session.' })
      );
    });

    it('should return a valid first time login context response.', async () => {
      const sessionParameters = <AuthorizationRequest>{
        response_type: 'code',
        client_id: 'client_id',
        redirect_uri: 'https://client.example.com/callback',
        scope: 'foo bar baz',
        state: 'client_state',
        response_mode: 'query',
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        parameters: sessionParameters,
        client: { id: 'client_id' },
        user: null,
      });

      const urlParameters = new URLSearchParams(sessionParameters);

      await expect(interactionType.handleContext(parameters)).resolves.toStrictEqual<LoginContextInteractionResponse>({
        skip: false,
        request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
        client: <Client>{ id: 'client_id' },
        context: {},
      });
    });

    it('should return a valid subsequent login context response.', async () => {
      const sessionParameters = <AuthorizationRequest>{
        response_type: 'code',
        client_id: 'client_id',
        redirect_uri: 'https://client.example.com/callback',
        scope: 'foo bar baz',
        state: 'client_state',
        response_mode: 'query',
      };

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        parameters: sessionParameters,
        client: { id: 'client_id' },
        user: { id: 'user_id' },
      });

      const urlParameters = new URLSearchParams(sessionParameters);

      await expect(interactionType.handleContext(parameters)).resolves.toStrictEqual<LoginContextInteractionResponse>({
        skip: true,
        request_url: `https://server.example.com/oauth/authorize?${urlParameters.toString()}`,
        client: <Client>{ id: 'client_id' },
        context: {},
      });
    });
  });

  describe('handleDecision()', () => {
    let parameters: LoginDecisionInteractionRequest;

    beforeEach(() => {
      parameters = { interaction_type: 'login', login_challenge: 'login_challenge', decision: <LoginDecision>'' };
    });

    it('should throw when the parameter "login_challenge" is not provided.', async () => {
      Reflect.deleteProperty(parameters, 'login_challenge');

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "login_challenge".' })
      );
    });

    it('should throw when the parameter "decision" is not provided.', async () => {
      Reflect.deleteProperty(parameters, 'decision');

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "decision".' })
      );
    });

    it('should throw when no session is found.', async () => {
      sessionServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid Session.' })
      );
    });

    it('should throw when the session is expired.', async () => {
      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{
        id: 'session_id',
        expiresAt: new Date(Date.now() - 3600000),
      });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Expired Session.' })
      );
    });

    it('should throw when providing an invalid decision.', async () => {
      Reflect.set(parameters, 'decision', 'unknown');

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Unsupported decision "unknown".' })
      );
    });

    it('should throw when the parameter "subject" is not provided.', async () => {
      Reflect.set(parameters, 'decision', 'accept');

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "subject".' })
      );
    });

    it('should throw when no user is found.', async () => {
      Reflect.set(parameters, 'decision', 'accept');
      Reflect.set(parameters, 'subject', 'user_id');

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id' });
      userServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new AccessDeniedException({ description: 'Invalid User.' })
      );
    });

    it('should return a valid login accept decision interaction response.', async () => {
      Reflect.set(parameters, 'decision', 'accept');
      Reflect.set(parameters, 'subject', 'user_id');

      const sessionParameters = <AuthorizationRequest>{
        response_type: 'code',
        client_id: 'client_id',
        redirect_uri: 'https://client.example.com/callback',
        scope: 'foo bar baz',
        state: 'client_state',
        response_mode: 'query',
      };

      const session = <Session>{ id: 'session_id', parameters: sessionParameters };
      const user = <User>{ id: 'user_id' };

      sessionServiceMock.findOne.mockResolvedValueOnce(session);
      userServiceMock.findOne.mockResolvedValueOnce(user);

      const urlParameters = new URLSearchParams(sessionParameters);

      await expect(interactionType.handleDecision(parameters)).resolves.toStrictEqual<LoginDecisionInteractionResponse>(
        { redirect_to: `https://server.example.com/oauth/authorize?${urlParameters.toString()}` }
      );

      expect(session.user).toStrictEqual(user);
      expect(sessionServiceMock.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when the parameter "error" is not provided.', async () => {
      Reflect.set(parameters, 'decision', 'deny');

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "error".' })
      );
    });

    it('should throw when the parameter "error_description" is not provided.', async () => {
      Reflect.set(parameters, 'decision', 'deny');
      Reflect.set(parameters, 'error', 'custom_error');

      Reflect.deleteProperty(parameters, 'error_description');

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      await expect(interactionType.handleDecision(parameters)).rejects.toThrow(
        new InvalidRequestException({ description: 'Invalid parameter "error_description".' })
      );
    });

    it('should return a valid login deny decision interaction response.', async () => {
      Reflect.set(parameters, 'decision', 'deny');
      Reflect.set(parameters, 'error', 'custom_error');
      Reflect.set(parameters, 'error_description', 'Custom error description.');

      sessionServiceMock.findOne.mockResolvedValueOnce(<Session>{ id: 'session_id' });

      userServiceMock.findOne.mockResolvedValueOnce({ id: 'user_id' });

      const urlParameters = new URLSearchParams({
        error: parameters.error,
        error_description: parameters.error_description,
      });

      await expect(interactionType.handleDecision(parameters)).resolves.toStrictEqual<LoginDecisionInteractionResponse>(
        { redirect_to: `https://server.example.com/oauth/error?${urlParameters.toString()}` }
      );

      expect(sessionServiceMock.remove).toHaveBeenCalledTimes(1);
    });
  });
});
