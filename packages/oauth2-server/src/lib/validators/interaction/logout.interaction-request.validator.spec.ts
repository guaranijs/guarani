import { Buffer } from 'buffer';

import { DependencyInjectionContainer } from '@guarani/di';

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
import { LogoutContextInteractionRequest } from '../../requests/interaction/logout-context.interaction-request';
import { LogoutDecisionInteractionRequest } from '../../requests/interaction/logout-decision.interaction-request';
import { LogoutDecisionAcceptInteractionRequest } from '../../requests/interaction/logout-decision-accept.interaction-request';
import { LogoutDecisionDenyInteractionRequest } from '../../requests/interaction/logout-decision-deny.interaction-request';
import { LogoutTicketServiceInterface } from '../../services/logout-ticket.service.interface';
import { LOGOUT_TICKET_SERVICE } from '../../services/logout-ticket.service.token';
import { SessionServiceInterface } from '../../services/session.service.interface';
import { SESSION_SERVICE } from '../../services/session.service.token';
import { LogoutInteractionRequestValidator } from './logout.interaction-request.validator';

const invalidLogoutChallenges: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidDecisions: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidSessionIdentifiers: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidErrors: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];
const invalidErrorDescriptions: any[] = [undefined, null, true, 1, 1.2, 1n, Symbol('a'), Buffer, () => 1, {}, []];

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
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: {},
        cookies: {},
        headers: {},
        method: 'GET',
        path: '/oauth/interaction',
        query: <LogoutContextInteractionRequest>{
          interaction_type: 'logout',
          logout_challenge: 'logout_challenge',
        },
      });
    });

    it.each(invalidLogoutChallenges)(
      'should throw when providing an invalid "logout_challenge" parameter.',
      async (logoutChallenge) => {
        request.query.logout_challenge = logoutChallenge;

        await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "logout_challenge".'
        );
      }
    );

    it('should throw when no logout ticket is found.', async () => {
      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateContext(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Logout Challenge.'
      );
    });

    it('should return a login context interaction context.', async () => {
      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateContext(request)).resolves.toStrictEqual<LogoutContextInteractionContext>({
        parameters: request.query as LogoutContextInteractionRequest,
        interactionType: interactionTypesMocks[2]!,
        logoutTicket,
      });
    });
  });

  describe('validateDecision()', () => {
    let request: HttpRequest;

    beforeEach(() => {
      request = new HttpRequest({
        body: <LogoutDecisionInteractionRequest>{
          interaction_type: 'logout',
          logout_challenge: 'logout_challenge',
        },
        cookies: {},
        headers: {},
        method: 'POST',
        path: '/oauth/interaction',
        query: {},
      });
    });

    it.each(invalidLogoutChallenges)(
      'should throw when providing an invalid "logout_challenge" parameter.',
      async (logoutChallenge) => {
        request.body.logout_challenge = logoutChallenge;

        await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "logout_challenge".'
        );
      }
    );

    it('should throw when no logout ticket is found.', async () => {
      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Logout Challenge.'
      );
    });

    it.each(invalidDecisions)('should throw when providing an invalid "decision" parameter.', async (decision) => {
      request.body.decision = decision;

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "decision".'
      );
    });

    it('should throw when providing an unsupported decision.', async () => {
      request.body.decision = 'unknown';

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Unsupported decision "unknown".'
      );
    });

    // #region Accept Decision
    it.each(invalidSessionIdentifiers)(
      'should throw when providing an invalid "session_id" parameter.',
      async (sessionId) => {
        Object.assign(request.body, { decision: 'accept', session_id: sessionId });

        const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

        logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

        await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "session_id".'
        );
      }
    );

    it('should throw when no session is found.', async () => {
      Object.assign(request.body, { decision: 'accept', session_id: 'session_id' });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(null);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        AccessDeniedException,
        'Invalid Session.'
      );
    });

    it('should return a logout decision accept interaction context.', async () => {
      Object.assign(request.body, { decision: 'accept', session_id: 'session_id' });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };
      const session = <Session>{ id: 'session_id' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);
      sessionServiceMock.findOne.mockResolvedValueOnce(session);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<LogoutDecisionAcceptInteractionContext>({
        parameters: request.body as LogoutDecisionAcceptInteractionRequest,
        interactionType: interactionTypesMocks[2]!,
        logoutTicket,
        decision: 'accept',
        session,
      });
    });
    // #endregion

    // #region Deny Decision
    it.each(invalidErrors)('should throw when providing an invalid "error" parameter.', async (error) => {
      Object.assign(request.body, { decision: 'deny', error });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
        InvalidRequestException,
        'Invalid parameter "error".'
      );
    });

    it.each(invalidErrorDescriptions)(
      'should throw when providing an invalid "error_description" parameter.',
      async (errorDescription) => {
        Object.assign(request.body, { decision: 'deny', error: 'logout_denied', error_description: errorDescription });

        const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

        logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

        await expect(validator.validateDecision(request)).rejects.toThrowWithMessage(
          InvalidRequestException,
          'Invalid parameter "error_description".'
        );
      }
    );

    it('should return a login decision deny interaction context.', async () => {
      Object.assign(request.body, {
        decision: 'deny',
        error: 'logout_denied',
        error_description: 'Lorem ipsum dolor sit amet...',
      });

      const logoutTicket = <LogoutTicket>{ id: 'logout_ticket_id', logoutChallenge: 'logout_challenge' };

      const error: OAuth2Exception = Object.assign<OAuth2Exception, Partial<OAuth2Exception>>(
        Reflect.construct(OAuth2Exception, [request.body.error_description as string]),
        { error: request.body.error as string }
      );

      logoutTicketServiceMock.findOneByLogoutChallenge.mockResolvedValueOnce(logoutTicket);

      await expect(validator.validateDecision(request)).resolves.toStrictEqual<LogoutDecisionDenyInteractionContext>({
        parameters: request.body as LogoutDecisionDenyInteractionRequest,
        interactionType: interactionTypesMocks[2]!,
        logoutTicket,
        decision: 'deny',
        error,
      });
    });
    // #endregion
  });
});
