import { AccountSelectionRequiredException } from './account-selection-required.exception';
import { ErrorCode } from './error-code.enum';

test('should instantiate a new account selection required exception.', () => {
  const exception = new AccountSelectionRequiredException({});

  expect(exception.code).toEqual(ErrorCode.AccountSelectionRequired);
  expect(exception.statusCode).toEqual(401);
});
