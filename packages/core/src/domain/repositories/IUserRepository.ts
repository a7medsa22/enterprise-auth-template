import { Result } from "../../shared/utils/Result";
import { User } from "../entities/User";
import { Email } from "../value-objects/Email";
import { UserId } from "../value-objects/UserId";

export interface IUserRepository {
    findById(id: UserId): Promise<Result<User>>;
    findByEmail(email: Email): Promise<Result<User>>;
    save(user: User): Promise<Result<void>>;
    update(user: User): Promise<Result<User>>;
    delete(id: UserId): Promise<Result<void>>;
    exists(email:Email): Promise<Result<boolean>>;
    findAll(skip?: number, take?: number): Promise<Result<User[]>>;
    count(): Promise<Result<number>>;

}