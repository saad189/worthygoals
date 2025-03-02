import * as argon2 from 'argon2';
import { Logger } from '@nestjs/common';

export class Security {
    private static logger = new Logger(Security.name);

    public static async securePassword(actualPassword: string): Promise<string> {
        try {
            return await argon2.hash(actualPassword);
        } catch (error) {
            this.logger.log(`Security:securePassword: ${JSON.stringify(error.message)}`)
            throw new Error(error.message)
        }
    }

    public static async verifyPassword(hashValue: string, password: string): Promise<boolean> {
        try {
            return await argon2.verify(hashValue, password);
        } catch (error) {
            this.logger.log(`Security:verifyPassword: ${JSON.stringify(error.message)}`)
            throw new Error(error.message)
        }
    }
}
