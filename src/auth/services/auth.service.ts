import { Injectable } from "@nestjs/common";
import { UserRepositoryPort } from "../interfaces/user-repository.interface";
import { PasswordServicePort } from "../interfaces/password.interface";
import { AuthDomainService } from "./auth-domain.service";
import { UsersServiceAdapter } from "../adapters/users-service.adapter";
import { BcryptPasswordAdapter } from "../adapters/bcrypt-password.adapter";
import { JwtService } from "@nestjs/jwt";
import { User } from "../interfaces/user.interface";
import { TokenPayload } from "../interfaces/token-payload.interface";
import { use } from "passport";

Injectable()
export class AuthService {
    private readonly domain:AuthDomainService ;

    constructor(
        usersAdapter:UsersServiceAdapter,
        passwordAdapter:BcryptPasswordAdapter,
        private readonly jwtService:JwtService,
    ) {
        this.domain = new AuthDomainService(usersAdapter,passwordAdapter);
    }

    async validateUser(email:string,password:string) {
        return this.domain.validateUser(email,password);
    }

    async login(user:User){
        const payload:TokenPayload = {
            sub:user.id,
            email:user.email,
            roles:user.roles
        };

        return {
            acessToken: this.jwtService.sign(payload),
            user,
        };
    }
    



}