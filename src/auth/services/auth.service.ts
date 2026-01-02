import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthDomainService } from "./auth-domain.service";
import { UsersServiceAdapter } from "../adapters/users-service.adapter";
import { User } from "../interfaces/user.interface";
import { TokenService } from "./token.service";

@Injectable()
export class AuthService {

    constructor(
        private readonly domain: AuthDomainService,
        private readonly tokenService: TokenService,
        private readonly usersAdapter: UsersServiceAdapter,
    ) {}

    async validateUser(email:string,password:string) {
        return this.domain.validateUser(email,password);
    }

    async register(email: string, pass: string) {
        return this.domain.register(email, pass);
    }

    async login(user:User){
       
        const accessToken = await this.tokenService.issueAccessToken(user);
        const refreshToken = await this.tokenService.issueRefreshToken(user.id);

        return {
            accessToken,
            refreshToken,
            user,
        };
    }

    async refresh(refreshToken: string) {
        const { userId } = await this.tokenService.rotateRefreshToken(refreshToken);
        
        const user = await this.usersAdapter.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const accessToken = await this.tokenService.issueAccessToken(user);
        const newRefreshToken = await this.tokenService.issueRefreshToken(user.id);

        return {
            accessToken,
            refreshToken: newRefreshToken,
            user,
        };
    }

    async logout(refreshToken: string) {
        return this.tokenService.revokeRefreshToken(refreshToken);
    }

}