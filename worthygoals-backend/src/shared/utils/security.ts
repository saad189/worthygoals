import * as argon2 from 'argon2';
import { Logger } from '@nestjs/common';

export class Security {
  private static logger = new Logger(Security.name);

  public static async securePassword(actualPassword: string): Promise<string> {
    try {
      return await argon2.hash(actualPassword);
    } catch (error) {
      this.logger.log(
        `Security:securePassword: ${JSON.stringify(error.message)}`,
      );
      throw new Error(error.message);
    }
  }

  public static async verifyPassword(
    hashValue: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashValue, password);
    } catch (error) {
      this.logger.log(
        `Security:verifyPassword: ${JSON.stringify(error.message)}`,
      );
      throw new Error(error.message);
    }
  }

  public static isHashedPasscode(value?: string | null): boolean {
    return !!value && value.startsWith('$argon2');
  }

  public static async hashPasscode(passcode: string): Promise<string> {
    return Security.securePassword(passcode);
  }

  public static async doesPasscodeMatch(
    stored: string,
    candidate: string,
  ): Promise<boolean> {
    if (!stored) return false;
    if (Security.isHashedPasscode(stored)) {
      return Security.verifyPassword(stored, candidate);
    }
    return stored === candidate;
  }
}
