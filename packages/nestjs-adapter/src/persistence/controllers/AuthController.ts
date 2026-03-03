import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { LoginUser } from "@auth-template/core/application/use-cases/auth/LoginUser";
import { RegisterUserUseCase } from "@auth-template/core/application/use-cases/auth/RegisterUser";
import { RefreshTokenUseCase } from "@auth-template/core/application/use-cases/auth/RefreshToken";
import { RegisterRequest } from "../dto/requests/RegisterRequest";
import { AuthResponse } from "../dto/responses/AuthResponse";
import { Public } from "../decorators/public.decorator";
import { LoginRequest } from "../dto/requests/LoginRequest";
import { Request } from "express";
import { CurrentUser } from "../decorators/current-user.decorator";
import { ChangePasswordRequest } from "../dto/requests/ChangePasswordRequest";
import { RefreshTokenRequest } from "../dto/requests/RefreshTokenRequest";
import { TokenResponse } from "../dto/responses/TokenResponse";
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
    constructor(
        private readonly registerUser: RegisterUserUseCase,
        private readonly loginUser: LoginUser,
        private readonly refreshToken: RefreshTokenUseCase,
    ) { }
    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() dto: RegisterRequest, @Req() req: Request): Promise<AuthResponse> {
        const result = await this.registerUser.execute({
            email: dto.email,
            password: dto.password,
        })

        if (result.isFailure) {
            throw new Error(result.error);
        }

        const data = result.getValue();
        return {
            user: {
                id: data.userId,
                email: data.email,
                roles: [],
                emailVerified: false,
                isActive: true,
                createdAt: new Date(),
            },
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
        };
    }
    async login(@Body() dto: LoginRequest, @Req() req: Request): Promise<AuthResponse> {
        const result = await this.loginUser.execute({
            email: dto.email,
            password: dto.password,
            ipAddress: req.ip || '127.0.0.1',
            userAgent: req.headers['user-agent'] || 'unknown',
        });
        if (result.isFailure) {
            throw new Error(result.error);
        }
        const data = result.getValue();
        return {
            user: {
                id: data.userId,
                email: data.email,
                roles: [],
                emailVerified: true,
                isActive: true,
                createdAt: new Date(),
            },
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
        };
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body() dto: RefreshTokenRequest): Promise<TokenResponse> {
        const result = await this.refreshToken.execute({
            refreshToken: dto.refreshToken,
        });

        if (result.isFailure) {
            throw new Error(result.error);
        }

        return result.getValue();
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getProfile(@CurrentUser() user: any) {
        return user;
    }

}
