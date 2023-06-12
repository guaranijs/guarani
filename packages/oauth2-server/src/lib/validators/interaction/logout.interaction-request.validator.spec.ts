import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'url';

import { DependencyInjectionContainer } from '@guarani/di';
import { removeNullishValues } from '@guarani/primitives';
import { OneOrMany } from '@guarani/types';

import { LogoutContextInteractionContext } from '../../context/interaction/logout-context.interaction-context';
import { LogoutDecisionAcceptInteractionContext } from '../../context/interaction/logout-decision-accept.interaction-context';
import { LogoutDecisionDenyInteractionContext } from '../../context/interaction/logout-decision-deny.interaction-context';
import { LogoutTicket } from '../../entities/logout-ticket.entity';
import { Session } from '../../entities/session.entity';
import { AccessDeniedException } from '../../exceptions/access-denied.exception';
import { InvalidRequestException } from '../../exceptions/invalid-request.exception';
import { OAuth2Exception } from '../../exceptions/oauth2.exception';
import { HttpRequest } from '../../http/http.request';
import { InteractionTypeInterface } from '../../interaction-types/interaction-type.interface';
import { INTERACTION_TYPE } from '../../interaction-types/interaction-type.token';
import { InteractionType } from '../../interaction-types/interaction-type.type';
import { LogoutDecision } from '../../interaction-types/logout-decision.type';
import { LogoutContextInteractionRequest } from '../../requests/interaction/logout-context.interaction-request';
import { LogoutDecisionInteractionRequest } from '../../requests/interaction/logout-decision.interaction-request';
import { LogoutTicketServiceInterface } from '../../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../../services/logout-ticket.service.token';
import { SessionServiceInterface } from '../../services/session.service.interface';
import { SESSION_SERVICE } from '../../services/session.service.token';
import { LogoutInteractionRequestValidator } from './logout.interaction-request.validator';

describe('Logout Interaction Request Validator', () => {
  let container: DependencyInjectionContainer;
  let validator: LogoutInteractionRequestValidator;

  const logoutTicketServiceMock = jest.mocked<LogoutTicketServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    findOneByLogoutChallenge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const sessionServiceMock = jest.mocked<SessionServiceInterface>({
    create: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  });

  const interactionTypesMocks = [
    jest.mocked<InteractionTypeInterface>({ name: 'consent', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'login', handleContext: jest.fn(), handleDecision: jest.fn() }),
    jest.mocked<InteractionTypeInterface>({ name: 'logout', handleContext: jest.fn(), handleDecision: jest.fn() }),
  ];

  beforeEach(() => {
    container = new DependencyInjectionContainer();

    container.bind<LogoutTicketServiceInterface>(LOGOUT_TICKET_SERVICE).toValue(logoutTicketServiceMock);
    container.bind<SessionServiceInterface>(SESSION_SERVICE).toValue(sessionServiceMock);

    interactionTypesMocks.forEach((interactionTypeMock) => {
      container.bind<InteractionTypeInterface>(INTERACTION_TYPE).toValue(interactionTypeMock);
    });

    container.bind(LogoutInteractionRequestValidator).toSelf().asSingleton();

    validator = container.resolve(LogoutInteractionRequestValidator);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('name', () => {
    it('should have "logout" as its name.', () => {
      expect(validator.name).toEqual<InteractionType>('logout');
    });
  });

  describe('validateContext()', () => {
    let parameters: LogoutContextInteractionRequest;

    const requestFactory = (data: Partial<LogoutContextInteractionRequest> = {}): HttpRequest => {
      parameters = removeNullishValues<LogoutContextInteractionRequest>(Object.assign(parameters, data));

      const query = new URLSearchParams(parameters as Record<string, OneOrMany<string>>);

      return new HttpRequest({
        body: Buffer.alloc(0),
        cookies: {},
        headers: {},
        method: 'GET',
        url: new URL(`https://server.example.com/oauth/interaction?${query.toString()}`),
      });
    };

    beforeEach(() => {
      parameters = { interaction_type: 'logout', logout_challenge: 'logout_challenge' };
    });

    it('should throw when not providing the parameter "logout_challenge".', async () => {
      const request = requestFactory({ logout_challenge: undefined });

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "logout_challenge".'
      );
    });

    it('should throw when no logout ticket is found.', async () => {
      const request = requestFactory();

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Logout Challenge.'
      );
    });

    it('should return a login context interaction context.', async () => {
      const request = requestFactory();

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<LogoutContextInteractionContext>({
        parameters: request.query,
        interactionType: interactionTypesMocks[2]!,
        logoutTicket,
      });
    });
  });

  describe('validateDecision()', () => {
    let parameters: LogoutDecisionInteractionRequest;

    const requestFactory = (data: Partial<LogoutDecisionInteractionRequest> = {}): HttpRequest => {
      parameters = removeNullishValues<LogoutDecisionInteractionRequest>(Object.assign(parameters, data));

      const body = new URLSearchParams(parameters as Record<string, OneOrMany<string>>);

      return new HttpRequest({
        body: Buffer.from(body.toString(), 'utf8'),
        cookies: {},
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: new URL('https://server.example.com/oauth/interaction'),
      });
    };

    beforeEach(() => {
      parameters = <LogoutDecisionInteractionRequest>{
        interaction_type: 'logout',
        logout_challenge: 'logout_challenge',
      };
    });

    it('should throw when not providing the parameter "logout_challenge".', async () => {
      const request = requestFactory({ logout_challenge: undefined });

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "logout_challenge".'
      );
    });

    it('should throw when no logout ticket is found.', async () => {
      const request = requestFactory();

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Logout Challenge.'
      );
    });

    it('should throw when not providing the parameter "decision".', async () => {
      const request = requestFactory({ decision: undefined });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "decision".'
      );
    });

    it('should throw when providing an unsupported decision.', async () => {
      const request = requestFactory({ decision: 'unknown' as LogoutDecision });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported decision "unknown".'
      );
    });

    // #region Accept Decision
    it('should throw when not providing the parameter "session_id".', async () => {
      const request = requestFactory({ decision: 'accept', session_id: undefined });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "session_id".'
      );
    });

    it('should throw when no session is found.', async () => {
      const request = requestFactory({ decision: 'accept', session_id: 'session_id' });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Session Identifier.'
      );
    });

    it('should return a logout decision accept interaction context.', async () => {
      const request = requestFactory({ decision: 'accept', session_id: 'session_id' });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };
      const session = <Session>{ id: 'session_id' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<LogoutDecisionAcceptInteractionContext>({
        parameters: request.form(),
        interactionType: interactionTypesMocks[2]!,
        logoutTicket,
        decision: 'accept',
        session,
      });
    });
    // #endregion

    // #region Deny Decision
    it('should throw when not providing the parameter "error".', async () => {
      const request = requestFactory({ decision: 'deny', error: undefined });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "error".'
      );
    });

    it('should throw when not providing the parameter "error_description".', async () => {
      const request = requestFactory({ decision: 'deny', error: 'logout_denied', error_description: undefined });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "error_description".'
      );
    });

    it('should return a login decision deny interaction context.', async () => {
      const request = requestFactory({
        decision: 'deny',
        error: 'logout_denied',
        error_description: 'Lorem ipsum dolor sit amet...',
      });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      const error: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, [parameters.error_description as string]),
        { error: parameters.error as string }
      );

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<LogoutDecisionDenyInteractionContext>({
        parameters: request.form(),
        interactionType: interactionTypesMocks[2]!,
        logoutTicket,
        decision: 'deny',
        error,
      });
    });
    // #endregion
  });
});
