import { Email } from "../../domain/value-objects/Email";
import { UserId } from "../../domain/value-objects/UserId";
import { Result } from "../../shared/utils/Result";
export interface TokenPayload {
    userId:string;
    email:string;
    role:string[];
}
export interface ITokenGenerator{
    generateAccessToken(userId:UserId,payload:TokenPayload):Promise<Result<string>>;
    generateRefreshToken(userId:UserId):Promise<Result<string>>;
    verifyAccessToken(token:string):Promise<Result<TokenPayload>>;
    verifyRefreshToken(token:string):Promise<Result<UserId>>;
    getAccessTokenExpiration(token:string):Promise<Result<Date>>;
    getRefreshTokenExpiration(token:string):Promise<Result<Date>>;
}
