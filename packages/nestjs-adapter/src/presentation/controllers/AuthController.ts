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
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  LoginUser,
  RegisterUserUseCase,
  RefreshTokenUseCase,
  LogoutUser,
  LogoutAllDevices,
  ChangePassword,
  VerifyEmail,
} from '@auth-template/core';
import { RegisterRequest } from '../dto/requests/RegisterRequest';
import { AuthResponse, UserDto } from '../dto/responses/AuthResponse';
import { Public } from '../decorators/public.decorator';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { Request } from 'express';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ChangePasswordRequest } from '../dto/requests/ChangePasswordRequest';
import { RefreshTokenRequest } from '../dto/requests/RefreshTokenRequest';
import { VerifyEmailRequest } from '../dto/requests/VerifyEmailRequest';
import { TokenResponse } from '../dto/responses/TokenResponse';

@ApiTags('Authentication')
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
    private readonly verifyEmail: VerifyEmail,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'The user has been successfully registered.', type: AuthResponse })
  @ApiBadRequestResponse({ description: 'Invalid input data or user already exists.' })
  async register(@Body() dto: RegisterRequest, @Req() req: Request): Promise<AuthResponse> {
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
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email address using verification token' })
  @ApiOkResponse({ description: 'Email verified successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid token or user ID.' })
  async verifyEmailHandler(@Body() dto: VerifyEmailRequest): Promise<{ message: string }> {
    const result = await this.verifyEmail.execute({
      userId: dto.userId,
      verificationToken: dto.verificationToken,
    });

    if (result.isFailure) {
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    }

    return { message: result.getValue().message };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in an existing user' })
  @ApiOkResponse({ description: 'The user has been successfully logged in.', type: AuthResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
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
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiOkResponse({ description: 'The tokens have been successfully refreshed.', type: TokenResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token.' })
  async refresh(@Body() dto: RefreshTokenRequest): Promise<TokenResponse> {
    const result = await this.refreshToken.execute({
      refreshToken: dto.refreshToken,
    });

    if (result.isFailure) {
      throw new HttpException(result.error, HttpStatus.UNAUTHORIZED);
    }

    return result.getValue();
  }

  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out a user from the current session' })
  @ApiOkResponse({ description: 'The user has been successfully logged out.' })
  @ApiBadRequestResponse({ description: 'Invalid user ID or refresh token.' })
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

  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log out a user from all active sessions' })
  @ApiOkResponse({ description: 'Logged out from all devices.' })
  @ApiBadRequestResponse({ description: 'Invalid user ID.' })
  async logoutAll(@CurrentUser('userId') userId: string): Promise<{ message: string }> {
    const result = await this.logoutAllDevices.execute({ userId });

    if (result.isFailure) {
      throw new HttpException(result.error, HttpStatus.BAD_REQUEST);
    }

    return { message: 'Logged out from all devices' };
  }

  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the password of the current user' })
  @ApiOkResponse({ description: 'Password changed successfully.' })
  @ApiBadRequestResponse({ description: 'Invalid current password or new password validation error.' })
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

  @ApiBearerAuth()
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Returns the current user profile data.', type: UserDto })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
