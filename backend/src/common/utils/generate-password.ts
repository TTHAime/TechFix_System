import { randomBytes } from 'node:crypto';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIAL = '!@#$%^&*_+-=?';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

function randomChar(charset: string): string {
  const index = randomBytes(1)[0] % charset.length;
  return charset[index];
}

export function generatePassword(length = 20): string {
  if (length < 15) length = 15;

  // Guarantee at least one of each required category
  const required = [
    randomChar(UPPER),
    randomChar(LOWER),
    randomChar(DIGITS),
    randomChar(SPECIAL),
  ];

  const remaining = Array.from({ length: length - required.length }, () =>
    randomChar(ALL),
  );

  // Shuffle using Fisher-Yates
  const chars = [...required, ...remaining];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
