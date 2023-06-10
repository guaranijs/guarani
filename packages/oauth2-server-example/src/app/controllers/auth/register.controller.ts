import axios, { AxiosError } from 'axios';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { URL, URLSearchParams } from 'url';

import {
  CodeAuthorizationRequest,
  CreateContextInteractionResponse,
  CreateDecisionInteractionRequest,
  CreateDecisionInteractionResponse,
  Display,
} from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { UserRegistrationDto } from '../../dto/user-registration.dto';
import { Session } from '../../entities/session.entity';

const popupTemplateFn = (redirectUri: string): string => `
<script type="text/javascript">
  window.opener.callback('${redirectUri}');
  window.close();
</script>
`;

class Controller {
  public async get(request: Request, response: Response): Promise<void> {
    try {
      const loginChallenge = request.query.login_challenge as string;

      if (typeof loginChallenge !== 'string') {
        const parameters: CodeAuthorizationRequest = {
          response_type: 'code',
          client_id: 'b1eeace9-2b0c-468e-a444-733befc3b35d',
          redirect_uri: 'http://localhost:4000/oauth/callback',
          scope: 'openid profile email phone address',
          state: randomUUID(),
          code_challenge: 'kRaf6IMJlerQjcqlFczEUYUcVsdwMpYonctl1yXYiiI',
          code_challenge_method: 'S256',
          prompt: 'create',
          nonce: 'nonce',
        };

        const url = new URL('http://localhost:4000/oauth/authorize');
        const searchParameters = new URLSearchParams(parameters);

        url.search = searchParameters.toString();

        return response.redirect(303, url.href);
      }

      const url = new URL('http://localhost:4000/oauth/interaction');
      const searchParams = new URLSearchParams({ interaction_type: 'create', login_challenge: loginChallenge });

      url.search = searchParams.toString();

      const { data } = await axios.get<CreateContextInteractionResponse>(url.href);

      if (data.context.display === 'popup') {
        response.cookie('display', 'popup');
      }

      if (data.skip) {
        return this.redirectOrClosePopup(response, data.request_url, data.context.display ?? null);
      }

      return response.render('auth/register', {
        request,
        title: 'Register',
        login_challenge: loginChallenge,
        errors: request.flash('errors'),
      });
    } catch (exc: unknown) {
      if (exc instanceof AxiosError) {
        response.json(exc.response?.data);
        return;
      }

      throw exc;
    }
  }

  public async post(request: Request, response: Response): Promise<void> {
    const { login_challenge: loginChallenge } = request.body;

    const userRegistrationDto = plainToInstance(UserRegistrationDto, request.body);

    const errors = await validate(userRegistrationDto);

    if (errors.length > 0) {
      request.flash('errors', errors.map((error) => Object.values(error.constraints ?? {})).flat());
      return response.redirect(303, `/auth/register?login_challenge=${loginChallenge}`);
    }

    const requestParameters: CreateDecisionInteractionRequest = {
      interaction_type: 'create',
      login_challenge: loginChallenge,
      ...userRegistrationDto,
    };

    const requestBody = new URLSearchParams(requestParameters);

    try {
      const {
        data: { redirect_to: redirectTo },
      } = await axios.post<CreateDecisionInteractionResponse>(
        'http://localhost:4000/oauth/interaction',
        requestBody.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const sessionId = request.signedCookies['guarani:session'];
      const session = await Session.findOneByOrFail({ id: sessionId });

      request.login(session.activeLogin!.user, { session: true }, () => {
        const display = request.cookies.display as Display;
        return this.redirectOrClosePopup(response, redirectTo, display);
      });
    } catch (exc: unknown) {
      if (exc instanceof AxiosError) {
        response.json(exc.response?.data);
        return;
      }

      throw exc;
    }
  }

  private redirectOrClosePopup(response: Response, url: string, display: Nullable<Display>): void {
    if (display === 'popup') {
      response.clearCookie('display').send(popupTemplateFn(url));
      return;
    }

    return response.redirect(303, url);
  }
}

export const RegisterController = new Controller();
