import { IsStrongPasswordOptions } from 'class-validator';

export const PASSWORD_OPTIONS: IsStrongPasswordOptions = {
  minLength: 9,
  minNumbers: 1,
  minUppercase: 1,
  minLowercase: 1,
  minSymbols: 1,
};

export const PASSWORD_VALIDATIONOPTIONS = {
  message: `Please make sure the following conditions are met:
Minimum length should be at least 9, At least one number,At least one uppercase letter, At least one lowercase letter, At least one Symbol.`,
};

export const JWT = 'jwt';
export const JWT_EXPIRATION = '1h';
