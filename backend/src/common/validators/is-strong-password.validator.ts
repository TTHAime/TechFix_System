import {
  registerDecorator,
  type ValidationOptions,
  type ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  '12345678901',
  'qwerty123',
  'qwertyuiop',
  'abcdefgh',
  'abcdefghi',
  'abcdefghij',
  'letmein123',
  'welcome123',
  'admin1234',
  'iloveyou1',
  'sunshine1',
  'princess1',
  'football1',
  'charlie123',
  'shadow123',
  'master123',
  'dragon123',
  'monkey1234',
  'abc12345',
  'trustno1',
  'baseball1',
  'passw0rd',
  'p@ssw0rd',
  'p@ssword',
  'changeme1',
  'whatever1',
  'internet1',
  'computer1',
  'superman1',
  'asdfghjkl',
  'zxcvbnm12',
  'q1w2e3r4t5',
  'qwerty1234',
]);

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  private reason = '';

  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      this.reason = 'Password must be a string';
      return false;
    }

    if (value.length < 15) {
      this.reason = 'Password must be at least 15 characters';
      return false;
    }

    if (value.length > 64) {
      this.reason = 'Password must be at most 64 characters';
      return false;
    }

    if (COMMON_PASSWORDS.has(value.toLowerCase())) {
      this.reason =
        'Password is too common — choose something less predictable';
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return this.reason;
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
