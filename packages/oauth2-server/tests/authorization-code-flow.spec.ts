import cookieParser from 'cookie-parser';
import { CookieAccessInfo } from 'cookiejar';
import express, { Application, urlencoded } from 'express';
import request, { SuperAgentTest } from 'supertest';
import { URL, URLSearchParams } from 'url';

import { ExpressBackend } from '../src/lib/backends/express/express.backend';
import { AuthorizationCodeTokenRequest } from '../src/lib/requests/token/authorization-code.token-request';
import { CodeAuthorizationRequest } from '../src/lib/requests/authorization/code.authorization-request';
import { CodeAuthorizationResponse } from '../src/lib/responses/authorization/code.authorization-response';
import { ConsentContextInteractionRequest } from '../src/lib/requests/interaction/consent-context.interaction-request';
import { ConsentContextInteractionResponse } from '../src/lib/responses/interaction/consent-context.interaction-response';
import { ConsentDecisionAcceptInteractionRequest } from '../src/lib/requests/interaction/consent-decision-accept.interaction-request';
import { LoginContextInteractionRequest } from '../src/lib/requests/interaction/login-context.interaction-request';
import { LoginDecisionAcceptInteractionRequest } from '../src/lib/requests/interaction/login-decision-accept.interaction-request';
import { TokenResponse } from '../src/lib/responses/token-response';
import { AuthorizationServerFactory } from '../src/lib/metadata/authorization-server.factory';

describe('Authorization Code Flow', () => {
  let app: Application;
  let agent: SuperAgentTest;
  let authorizationCode: string;
  let authorizationServer: ExpressBackend;

  beforeAll(async () => {
    app = express();

    app.use(cookieParser('super_safe_and_secure_secret'));
    app.use(urlencoded({ extended: false }));

    authorizationServer = await AuthorizationServerFactory.create(
      ExpressBackend,
      Reflect.get(global, 'endToEndAuthorizationServerOptions')
    );

    await authorizationServer.bootstrap();

    app.use(authorizationServer.router);

    agent = request.agent(app);
  });

  it('GET /oauth/authorize', async () => {
    // #region Retrieve the Login Challenge.
    const authorizationRequestData: CodeAuthorizationRequest = {
      response_type: 'code',
      client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
      redirect_uri: 'http://localhost:4000/oauth/callback',
      scope: 'foo bar baz qux',
      code_challenge: 'qoJXAtQ-gjzfDmoMrHt1a2AFVe1Tn3-HX0VC2_UtezA',
      code_challenge_method: 'S256',
      state: '2f3ebe49f9ade4bc8b6d90f4da3480a8',
      response_mode: 'query',
    };

    const authorizationRequestSearchParameters = new URLSearchParams(authorizationRequestData);

    const loginAuthorizationResponse = await agent.get(
      `/oauth/authorize?${authorizationRequestSearchParameters.toString()}`
    );

    const loginUrl = new URL(loginAuthorizationResponse.headers.location);
    const loginChallenge = loginUrl.searchParams.get('login_challenge')!;

    expect(loginAuthorizationResponse.status).toBe(303);

    expect(agent.jar.getCookie('guarani:grant', CookieAccessInfo.All)?.value).toEqual(expect.any(String));
    expect(agent.jar.getCookie('guarani:session', CookieAccessInfo.All)?.value).toBeUndefined();
    // #endregion

    // #region Create the Session within the Authorization Server.
    const loginInteractionContextRequestData: LoginContextInteractionRequest = {
      interaction_type: 'login',
      login_challenge: loginChallenge,
    };

    const loginInteractionRequestBody = new URLSearchParams(loginInteractionContextRequestData);

    const loginInteractionContextResponse = await agent.get(
      `/oauth/interaction?${loginInteractionRequestBody.toString()}`
    );

    expect(loginInteractionContextResponse.body.skip).toBe(false);
    // #endregion

    // #region Update the Session with the Authenticated User.
    const loginInteractionAcceptDecisionRequestData: LoginDecisionAcceptInteractionRequest = {
      interaction_type: 'login',
      login_challenge: loginChallenge,
      decision: 'accept',
      subject: '16907c32-687b-493c-85ba-f41f2c9d4daa',
    };

    const loginInteractionAcceptDecisionBody = new URLSearchParams(loginInteractionAcceptDecisionRequestData);

    const loginInteractionAcceptResponse = await agent
      .post('/oauth/interaction')
      .send(loginInteractionAcceptDecisionBody.toString());

    expect(loginInteractionAcceptResponse.status).toBe(200);
    expect(loginInteractionAcceptResponse.body.redirect_to).toBe(loginInteractionContextResponse.body.request_url);
    // #endregion

    // #region Retrieve the Consent Challenge.
    const consentAuthorizationResponse = await agent.get(
      `/oauth/authorize?${authorizationRequestSearchParameters.toString()}`
    );

    const consentUrl = new URL(consentAuthorizationResponse.headers.location);
    const consentChallenge = consentUrl.searchParams.get('consent_challenge')!;

    expect(consentAuthorizationResponse.status).toBe(303);

    expect(agent.jar.getCookie('guarani:grant', CookieAccessInfo.All)?.value).toEqual(expect.any(String));
    // #endregion

    // # Create the Consent within the Authorization Server.
    const consentInteractionContextRequestData: ConsentContextInteractionRequest = {
      interaction_type: 'consent',
      consent_challenge: consentChallenge,
    };

    const consentInteractionRequestBody = new URLSearchParams(consentInteractionContextRequestData);

    const consentInteractionContextResponse = await agent.get(
      `/oauth/interaction?${consentInteractionRequestBody.toString()}`
    );

    expect(consentInteractionContextResponse.body).toMatchObject<Partial<ConsentContextInteractionResponse>>({
      skip: false,
      requested_scope: 'foo bar baz qux',
      subject: '16907c32-687b-493c-85ba-f41f2c9d4daa',
      request_url: loginInteractionContextResponse.body.request_url,
      login_challenge: loginChallenge,
    });
    // #endregion

    // #region Update the Consent with the Authenticated User.
    const consentInteractionAcceptDecisionRequestData: ConsentDecisionAcceptInteractionRequest = {
      interaction_type: 'consent',
      consent_challenge: consentChallenge,
      decision: 'accept',
      grant_scope: 'foo bar baz qux',
    };

    const consentInteractionAcceptDecisionBody = new URLSearchParams(consentInteractionAcceptDecisionRequestData);

    const consentInteractionAcceptResponse = await agent
      .post('/oauth/interaction')
      .send(consentInteractionAcceptDecisionBody.toString());

    expect(consentInteractionAcceptResponse.status).toBe(200);
    expect(consentInteractionAcceptResponse.body.redirect_to).toBe(loginInteractionContextResponse.body.request_url);
    // #endregion

    // #region Retrieve the Authorization Code.
    const authorizationResponse = await agent.get(
      `/oauth/authorize?${authorizationRequestSearchParameters.toString()}`
    );

    const callbackUrl = new URL(authorizationResponse.headers.location);

    expect(authorizationResponse.status).toBe(303);

    expect(agent.jar.getCookie('guarani:grant', CookieAccessInfo.All)?.value).toBeUndefined();

    expect(Object.fromEntries(callbackUrl.searchParams.entries())).toStrictEqual<CodeAuthorizationResponse>({
      code: expect.any(String),
      state: authorizationRequestData.state,
      iss: 'http://localhost:3000',
    });

    authorizationCode = callbackUrl.searchParams.get('code')!;
    // #endregion
  });

  it('POST /oauth/token', async () => {
    const requestData: AuthorizationCodeTokenRequest = {
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: 'http://localhost:4000/oauth/callback',
      code_verifier: 'code_challenge',
    };

    const requestBody = new URLSearchParams(requestData);

    const response = await request(app)
      .post('/oauth/token')
      .auth('b1eeace9-2b0c-468e-a444-733befc3b35d', 'z9IyV0Pd6_-0XRJP5DN-UvFYeP56sbNX', { type: 'basic' })
      .send(requestBody.toString());

    expect(response.status).toBe(200);

    expect(response.body).toStrictEqual<TokenResponse>({
      access_token: expect.any(String),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'foo bar baz qux',
      refresh_token: expect.any(String),
    });
  });
});
