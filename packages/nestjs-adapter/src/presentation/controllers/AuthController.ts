import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  LoginUser,
  RegisterUserUseCase,
  RefreshTokenUseCase,
  LogoutUser,
  LogoutAllDevices,
  ChangePassword,
} from '@auth-template/core';
import { RegisterRequest } from '../dto/requests/RegisterRequest';
import { AuthResponse } from '../dto/responses/AuthResponse';
import { Public } from '../decorators/public.decorator';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { Request } from 'express';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ChangePasswordRequest } from '../dto/requests/ChangePasswordRequest';
import { RefreshTokenRequest } from '../dto/requests/RefreshTokenRequest';
import { TokenResponse } from '../dto/responses/TokenResponse';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUser,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly logoutUser: LogoutUser,
    private readonly logoutAllDevices: LogoutAllDevices,
    private readonly changePassword: ChangePassword,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterRequest,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    const result = await this.registerUser.execute({
      email: dto.email,
      password: dto.password,
    });

    if (result.isFailure) {
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    }

    const data = result.getValue();
    return {
      user: {
        id: data.userId,
        email: data.email,
        roles: ['USER'],
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
      },
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequest, @Req() req: Request): Promise<AuthResponse> {
    const result = await this.loginUser.execute({
      email: dto.email,
      password: dto.password,
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'unknown',
    });
    if (result.isFailure) {
      throw new HttpException(result.error, HttpStatus.UNAUTHORIZED);
    }
    const data = result.getValue();
    return {
      user: {
        id: data.userId,
        email: data.email,
        roles: data.roles,
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
      throw new HttpException(result.error, HttpStatus.UNAUTHORIZED);
    }

    return result.getValue();
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('userId') userId: string,
    @Body() dto: RefreshTokenRequest,
  ): Promise<{ message: string }> {
    const result = await this.logoutUser.execute({
      userId,
      refreshToken: dto.refreshToken,
    });

    if (result.isFailure) {
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser('userId') userId: string): Promise<{ message: string }> {
    const result = await this.logoutAllDevices.execute({ userId });

    if (result.isFailure) {
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Logged out from all devices' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePasswordHandler(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordRequest,
  ): Promise<{ message: string }> {
    const result = await this.changePassword.execute({
      userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });

    if (result.isFailure) {
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Password changed successfully' };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
