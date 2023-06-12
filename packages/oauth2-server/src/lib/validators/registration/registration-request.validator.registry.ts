import { Constructor } from '@guarani/types';

import { HttpMethod } from '../../http/http-method.type';
import { DeleteRegistrationRequestValidator } from './delete.registration-request.validator';
import { GetRegistrationRequestValidator } from './get.registration-request.validator';
import { PostRegistrationRequestValidator } from './post.registration-request.validator';
import { PutRegistrationRequestValidator } from './put.registration-request.validator';
import { RegistrationRequestValidator } from './registration-request.validator';

/**
 * Registration Request Validators Registry.
 */
export const registrationRequestValidatorsRegistry: Record<HttpMethod, Constructor<RegistrationRequestValidator>> = {
  DELETE: DeleteRegistrationRequestValidator,
  GET: GetRegistrationRequestValidator,
  POST: PostRegistrationRequestValidator,
  PUT: PutRegistrationRequestValidator,
};
