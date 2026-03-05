import { Injectable } from "@nestjs/common";
import { IPasswordHasher } from '@auth-template/core/application'
import { Result, PasswordValidator } from "@auth-template/core";
import * as bcrypt from 'bcrypt';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class BcryptHasher implements IPasswordHasher {
    private readonly rounds: number
    constructor(
        private readonly configService: ConfigService
    ) {
        this.rounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    }
    async hash(password: string): Promise<Result<string>> {
        try {
            const hashed = await bcrypt.hash(password, this.rounds)
            return Result.ok(hashed)
        } catch (error) {
            return Result.fail(`Failed to hash password: ${error}`);
        }

    }
    async compare(password: string, hashed: string): Promise<Result<boolean>> {
        try {
            const isMatch = await bcrypt.compare(password, hashed);
            return Result.ok(isMatch)
        } catch (error) {
            return Result.fail(`Failed to compare passwords: ${error}`);
        }

    }

    validate(password: string): Result<void> {
        return PasswordValidator.validate(password);
    }
}
