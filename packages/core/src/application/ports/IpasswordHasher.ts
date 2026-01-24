import { Result } from "../../shared/utils/Result";

export interface IPasswordHasher {
    hash(password: string): Promise<Result<string>>;
    compare(password: string, hashed: string): Promise<Result<boolean>>;
    validate(password: string): Promise<Result<boolean>>;
}