import { AccountSelectionRequiredException } from './account-selection-required.exception';
import { ErrorCode } from './error-code.type';

test('should instantiate a new account selection required exception.', () => {
  const exception = new AccountSelectionRequiredException({});

  expect(exception.code).toEqual<ErrorCode>('account_selection_required');
  expect(exception.statusCode).toBe(401);
});
