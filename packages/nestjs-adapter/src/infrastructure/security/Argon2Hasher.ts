import { IPasswordHasher } from "@auth-template/core/application/ports/IpasswordHasher";
import { Result } from "@auth-template/core/shared/utils/Result";
import { PasswordValidator } from '@auth-template/core/shared/utils/PasswordValidator';
import { Injectable } from "@nestjs/common";
import * as argon2 from 'argon2';


@Injectable()
export class Argon2Hasher implements IPasswordHasher {
    constructor() { }
    async hash(password: string): Promise<Result<string>> {
        try {
            const hashed = await argon2.hash(password, {
                memoryCost: 65536,
                timeCost: 3,
                parallelism: 3
            });
            return Result.ok(hashed)
        } catch (error) {
            return Result.fail(`Failed to hash password: ${error}`);
        }
    }
    async compare(plain: string, hashed: string): Promise<Result<boolean>> {
        try {
            const isMatch = await argon2.verify(hashed, plain);
            return Result.ok(isMatch);
        } catch (error) {
            return Result.fail(`Failed to compare passwords: ${error}`);
        }
    }
    validate(password: string): Result<void> {
        return PasswordValidator.validate(password);
    }
}