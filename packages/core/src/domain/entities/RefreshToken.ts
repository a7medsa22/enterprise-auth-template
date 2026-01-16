import { Result } from "../../shared/utils/Result";
import { Token } from "../value-objects/Token";
import { TokenId } from "../value-objects/TokenId";
import { UserId } from "../value-objects/UserId";
import { Entity } from "./base/Entity";

interface RefreshTokenProps  {
  id:TokenId;
  userId:UserId;
  token:Token;
  isRevoked:boolean;
  expiresAt:Date;
   createdAt:Date;
}

interface CreateRefreshTokenProps {
    userId: UserId;
    token: Token;
    expiresAt: Date;
}

export class RefreshToken extends Entity<TokenId>{
    private readonly userId:UserId;
    private readonly token:Token;
    private  _isRevoked:boolean;
    private readonly expiresAt:Date;
    private readonly createdAt:Date;

    constructor(props: RefreshTokenProps) {
        super(props.id);
        this.userId = props.userId;
        this.token = props.token;
        this._isRevoked = props.isRevoked;
        this.expiresAt = props.expiresAt;
        this.createdAt = props.createdAt;
    }
    public static create(props: CreateRefreshTokenProps): Result<RefreshToken> {
        if(props.expiresAt <= new Date()){
            throw new Error('Refresh token expiry must be in the future');
        }

        const refreshToken = new RefreshToken({
            id: TokenId.create(),
            userId: props.userId,
            token: props.token,
            isRevoked: false,
            expiresAt: props.expiresAt,
            createdAt: new Date(),
        });
        return Result.ok(refreshToken);
    }

    public static restore(props: RefreshTokenProps): Result<RefreshToken> {
        return Result.ok(new RefreshToken(props));
    }

    public revoke(): Result<void> {
        if(this._isRevoked){
            throw new Error('Refresh token is already revoked');
        }
        this._isRevoked = true;
        return Result.ok();
    }
    public isExpired(): boolean {
        return this.expiresAt < new Date();
    }
    public isValid(): boolean {
        return !this._isRevoked && !this.isExpired();
    }

    //Getter
    public getUserId(): UserId {
        return this.userId;
    }
    public getToken(): Token {
        return this.token;
    }
    public getIsRevoked(): boolean {
        return this._isRevoked;
    }
    public getExpiresAt(): Date {
        return this.expiresAt;
    }
    public getCreatedAt(): Date {
        return this.createdAt;
    }
}