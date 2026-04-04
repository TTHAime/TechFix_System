import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';
import zxcvbn from 'zxcvbn';

function checkPassword(value: unknown): { valid: boolean; reason: string } {
  if (typeof value !== 'string') {
    return { valid: false, reason: 'Password must be a string' };
  }

  if (value.length < 15) {
    return { valid: false, reason: 'Password must be at least 15 characters' };
  }

  if (value.length > 64) {
    return { valid: false, reason: 'Password must be at most 64 characters' };
  }

  if (!/[A-Z]/.test(value)) {
    return {
      valid: false,
      reason: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/[a-z]/.test(value)) {
    return {
      valid: false,
      reason: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/[0-9]/.test(value)) {
    return {
      valid: false,
      reason: 'Password must contain at least one number',
    };
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return {
      valid: false,
      reason: 'Password must contain at least one special character',
    };
  }

  const result = zxcvbn(value);
  if (result.score < 3) {
    return {
      valid: false,
      reason: 'Password is too weak — try a longer or more varied password',
    };
  }

  return { valid: true, reason: '' };
}

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return checkPassword(value).valid;
  }

  defaultMessage(args: ValidationArguments): string {
    return checkPassword(args.value).reason;
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}
