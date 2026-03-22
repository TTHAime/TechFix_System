import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {
  private readonly pepper = process.env.PEPPER ?? '';

  private applyPepper(password: string): string {
    return `${this.pepper}:${password}`;
  }

  async hash(password: string) {
    return argon2.hash(this.applyPepper(password), {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
  }

  async verify(hash: string, password: string) {
    return argon2.verify(hash, this.applyPepper(password));
  }
}
