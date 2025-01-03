import { Inject, Injectable } from '@guarani/di';
import { isPlainObject, JSON } from '@guarani/primitives';

import { User } from '../entities/user.entity';
import { InvalidRequestException } from '../exceptions/invalid-request.exception';
import { Logger } from '../logger/logger';
import { UserServiceInterface } from '../services/user.service.interface';
import { USER_SERVICE } from '../services/user.service.token';
import { Settings } from '../settings/settings';
import { SETTINGS } from '../settings/settings.token';
import { UserClaimsParameters } from '../tokens/user.claims.parameters';
import { AuthorizationRequestClaimsParameter } from '../types/authorization-request-claims-parameter.type';

/**
 * Handler used to aggregate the operations for the End-User's Claims.
 */
@Injectable()
export class ClaimsHandler {
  /**
   * Instantiates a new Claims Handler.
   *
   * @param logger Logger of the Authorization Server.
   * @param settings Settings of the Authorization Server.
   * @param userService Instance of the User Service.
   */
  public constructor(
    private readonly logger: Logger,
    @Inject(SETTINGS) private readonly settings: Settings,
    @Inject(USER_SERVICE) private readonly userService: UserServiceInterface,
  ) {
    if (typeof this.userService.getUserClaims !== 'function') {
      const exc = new TypeError('Missing implementation of required method "UserServiceInterface.getUserClaims".');

      this.logger.critical(
        `[${this.constructor.name}] Missing implementation of required method "UserServiceInterface.getUserClaims"`,
        '93b62e3b-89a1-4f64-b741-c31ae229e626',
        null,
        exc,
      );

      throw exc;
    }
  }

  /**
   * Checks if the claims parameter requested by the Client are valid.
   *
   * @param claims Claims requested by the Client.
   * @returns Parsed Claims parameter requested by the Client.
   */
  public checkRequestedClaims(claims: string): AuthorizationRequestClaimsParameter {
    this.logger.debug(
      `[${this.constructor.name}] Called checkRequestedClaims()`,
      '73f9c527-8e27-4891-9096-4c4d1d73fec9',
      { claims },
    );

    if (!this.settings.enableClaimsAuthorizationRequestParameter) {
      const exc = new InvalidRequestException(
        'The Authorization Server does not support the "claims" Authorization Parameter.',
      );

      this.logger.error(
        `[${this.constructor.name}] The Authorization Server does not support the "claims" Authorization Parameter`,
        '3a19f5d7-9041-4177-b1d1-215f42b51f00',
        null,
        exc,
      );

      throw exc;
    }

    let parsedClaims: AuthorizationRequestClaimsParameter;

    try {
      parsedClaims = JSON.parse(claims);
    } catch {
      const exc = new InvalidRequestException('Invalid parameter "claims".');

      this.logger.error(
        `[${this.constructor.name}] Invalid parameter "claims"`,
        'e8030e14-5c9a-4b47-973c-8587b77f3b48',
        { requested_claims: claims },
        exc,
      );

      throw exc;
    }

    if (!isPlainObject(parsedClaims)) {
      const exc = new InvalidRequestException('The "claims" parameter is not a valid JSON object.');

      this.logger.error(
        `[${this.constructor.name}] The "claims" parameter is not a valid JSON object`,
        'cc9ae78e-f26c-47cb-87e7-e5bfef4934f6',
        { requested_claims: parsedClaims },
        exc,
      );

      throw exc;
    }

    Object.entries(parsedClaims).forEach(([topLevelClaim, individualClaims]) => {
      if (!isPlainObject(individualClaims)) {
        const exc = new InvalidRequestException(`The top-level claim "${topLevelClaim}" is not a valid JSON object.`);

        this.logger.error(
          `[${this.constructor.name}] The top-level claim "${topLevelClaim}" is not a valid JSON object`,
          '15e4a7b1-7641-4df7-aa47-d91bf8ba04d2',
          { requested_claims: parsedClaims },
          exc,
        );

        throw exc;
      }

      Object.entries(individualClaims).forEach(([individualClaim, individualClaimOptions]) => {
        if (typeof individualClaimOptions === 'undefined' || individualClaimOptions === null) {
          return;
        }

        if (!isPlainObject(individualClaimOptions)) {
          const exc = new InvalidRequestException(
            `The options for the claim "${topLevelClaim}.${individualClaim}" is not a valid JSON object.`,
          );

          this.logger.error(
            `[${this.constructor.name}] The options for the claim "${topLevelClaim}.${individualClaim}" is not a valid JSON object`,
            '9fbed645-bed1-465c-ba9f-12aede2e14ae',
            { requested_claims: parsedClaims },
            exc,
          );

          throw exc;
        }

        if (
          typeof individualClaimOptions.value !== 'undefined' &&
          typeof individualClaimOptions.values !== 'undefined'
        ) {
          const exc = new InvalidRequestException(
            `Cannot have both "value" and "values" options for the claim "${topLevelClaim}.${individualClaim}".`,
          );

          this.logger.error(
            `[${this.constructor.name}] Cannot have both "value" and "values" options for the claim "${topLevelClaim}.${individualClaim}"`,
            'c043be0c-e47b-4266-b2ce-409337bec30b',
            { requested_claims: parsedClaims },
            exc,
          );

          throw exc;
        }

        if (typeof individualClaimOptions.values !== 'undefined' && !Array.isArray(individualClaimOptions.values)) {
          const exc = new InvalidRequestException(
            `The "values" option for the claim "${topLevelClaim}.${individualClaim}" must be an array.`,
          );

          this.logger.error(
            `[${this.constructor.name}] The "values" option for the claim "${topLevelClaim}.${individualClaim}" must be an array`,
            '93fd129c-fc1a-4cb0-9ff1-60066178de6b',
            { requested_claims: parsedClaims },
            exc,
          );

          throw exc;
        }
      });
    });

    return parsedClaims;
  }

  /**
   * Retrieves the claims of the provided User based on the requested scopes and claims.
   *
   * @param user End User to have its information gathered.
   * @param scopes Scopes requested by the Client.
   * @param claims Claims requested by the Client.
   * @returns Claims about the provided User.
   */
  public async getUserClaims(
    user: User,
    scopes: string[],
    claims: AuthorizationRequestClaimsParameter,
  ): Promise<UserClaimsParameters> {
    const userClaims = await this.userService.getUserClaims!(user, scopes, claims);

    return userClaims;
  }
}
